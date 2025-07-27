from google.adk.tools import ToolContext
from google import genai
from .... import config
import json
import time
import random

# Initialize Gemini client (following same pattern as image_generation_tool)
client = genai.Client(
    vertexai=True
)


def generate_educational_content(tool_context: ToolContext) -> dict:
    """Generates educational content based on the planned structure."""
    
    try:
        language_context = tool_context.state.get('language_context', {})
        content_plan = tool_context.state.get('content_plan', {})
        cultural_guidelines = tool_context.state.get('cultural_guidelines', {})
        
        # Extract key information
        detected_language = language_context.get('detected_language', 'english')
        content_type = content_plan.get('content_type', 'story')
        educational_topic = content_plan.get('educational_topic', 'general')
        cultural_region = content_plan.get('cultural_region', 'India')
        original_request = language_context.get('original_request', '')
        structure = content_plan.get('structure', {})
        learning_objectives = content_plan.get('learning_objectives', [])
        cultural_references = content_plan.get('cultural_references', [])
        
        # Generate content using Gemini based on type and structure
        generated_content = generate_content_with_gemini(
            educational_topic, cultural_region, detected_language,
            content_type, structure, cultural_references, original_request
        )
        
        # Add metadata
        generated_content.update({
            'title': content_plan.get('title', 'Educational Content'),
            'language': detected_language,
            'content_type': content_type,
            'educational_topic': educational_topic,
            'cultural_region': cultural_region,
            'learning_objectives': learning_objectives,
            'cultural_elements': cultural_references,
            'target_audience': language_context.get('target_audience', 'students'),
            'complexity_level': content_plan.get('complexity_level', 'moderate')
        })
        
        # Store generated content
        iteration_count = tool_context.state.get("content_iteration", 0)
        tool_context.state[f'generated_content_{iteration_count}'] = generated_content
        tool_context.state['latest_generated_content'] = generated_content
        
        return {
            'status': 'success',
            'message': f'Educational {content_type} generated successfully in {detected_language}',
            'content': generated_content
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Error generating content: {str(e)}'
        }


def generate_content_with_gemini(topic, region, language, content_type, structure, cultural_refs, original_request):
    """Generate content using Gemini API with proper language support."""
    
    try:
        # Create detailed prompt for content generation
        prompt = create_content_generation_prompt(
            topic, region, language, content_type, structure, cultural_refs, original_request
        )
        
        # Generate content using Gemini
        response = client.models.generate_content(
            model=config.GENAI_MODEL,
            contents=prompt
        )
        
        # Extract generated content
        if response.candidates and len(response.candidates) > 0:
            generated_text = response.candidates[0].content.parts[0].text
            
            # Parse and structure the response
            content = {
                'main_content': generated_text,
                'generated_by': 'gemini',
                'language_used': language,
                'content_type': content_type,
                'generation_method': 'ai_generated'
            }
            
            return content
        else:
            # Fallback to enhanced template-based generation
            print("No candidates in Gemini response, falling back to enhanced template")
            return generate_enhanced_template_content(topic, region, language, content_type, structure, cultural_refs, original_request)
            
    except Exception as e:
        error_msg = str(e)
        print(f"Gemini generation failed: {error_msg}")
        
        # Check if it's a rate limit error and provide helpful message
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            print("Rate limit hit - using enhanced template generation instead")
        
        # Always fallback to enhanced template generation
        return generate_enhanced_template_content(topic, region, language, content_type, structure, cultural_refs, original_request)


def create_content_generation_prompt(topic, region, language, content_type, structure, cultural_refs, original_request):
    """Create a detailed prompt for Gemini content generation."""
    
    # Language-specific instructions
    language_instructions = {
        'marathi': 'Write the content primarily in Marathi (मराठी) using Devanagari script. Use simple, conversational Marathi that students can easily understand.',
        'hindi': 'Write the content primarily in Hindi (हिंदी) using Devanagari script. Use simple, conversational Hindi.',
        'gujarati': 'Write the content primarily in Gujarati (ગુજરાતી) using Gujarati script.',
        'tamil': 'Write the content primarily in Tamil (தமிழ்) using Tamil script.',
        'telugu': 'Write the content primarily in Telugu (తెలుగు) using Telugu script.',
        'kannada': 'Write the content primarily in Kannada (ಕನ್ನಡ) using Kannada script.',
        'bengali': 'Write the content primarily in Bengali (বাংলা) using Bengali script.',
        'english': 'Write the content in simple, clear English suitable for Indian students.'
    }
    
    lang_instruction = language_instructions.get(language, language_instructions['english'])
    
    prompt = f"""
You are an expert educational content creator specializing in culturally relevant materials for Indian students.

TASK: Create a {content_type} about {topic} for students in {region}.

LANGUAGE REQUIREMENT: {lang_instruction}

ORIGINAL REQUEST: {original_request}

CULTURAL CONTEXT:
- Region: {region}
- Cultural references to include: {', '.join(cultural_refs) if cultural_refs else 'Local cultural elements'}
- Use familiar local examples, names, and settings

CONTENT REQUIREMENTS:
1. Educational Value: Clearly explain concepts related to {topic}
2. Cultural Relevance: Use local examples and cultural context
3. Age Appropriate: Use simple language suitable for school students
4. Engaging: Make it interesting and relatable
5. Accurate: Ensure factual correctness

STRUCTURE: {structure if structure else 'Follow standard narrative structure'}

Please generate the complete {content_type} now:
"""
    
    return prompt


def generate_enhanced_template_content(topic, region, language, content_type, structure, cultural_refs, original_request):
    """Generate high-quality template-based educational content with proper language support."""
    
    if content_type == 'story':
        return generate_enhanced_story(topic, region, language, structure, cultural_refs, original_request)
    elif content_type == 'explanation':
        return generate_enhanced_explanation(topic, region, language, structure, cultural_refs, original_request)
    elif content_type == 'dialogue':
        return generate_enhanced_dialogue(topic, region, language, structure, cultural_refs, original_request)
    else:
        return generate_enhanced_story(topic, region, language, structure, cultural_refs, original_request)


def generate_enhanced_story(topic, region, language, structure, cultural_refs, original_request):
    """Generate enhanced story content with proper language support."""
    
    # Marathi soil types story
    if language == 'marathi' and 'soil' in topic.lower():
        content = {
            'main_content': """
# मातीचे प्रकार - राजूची शेतकऱ्याची कहाणी

महाराष्ट्रातील एका छोट्या गावात राजू नावाचा तरुण शेतकरी राहत होता. त्याच्या शेतात विविध पिके वेगवेगळ्या प्रकारे वाढत होती. काही ठिकाणी गहू चांगला होता, तर काही ठिकाणी कमी.

## मुख्य कहाणी:

एक दिवसी राजूने आपल्या आजोबांना विचारले, "आजोबा, आपल्या शेतात सगळीकडे एकसारखे बियाणे पेरतो, पाणी देतो, तरी पीक वेगवेगळे का होते?"

आजोबांनी हसून उत्तर दिले, "बेटा, सगळी माती एकसारखी नसते. चल, मी तुला दाखवतो."

### मातीचे प्रकार:

**१. काळी माती (रेगूर माती):**
- "हा काळसर माती पाहा राजू. यात भरपूर खनिजे आहेत."
- "यामध्ये कापूस, ज्वारी, बाजरी चांगले होते."
- "पाऊस आल्यावर ही माती फुगते आणि उन्हाळ्यात आकुंचन पावते."

**२. लाल माती:**
- "या लालसर मातीत लोह जास्त आहे."
- "यामध्ये शेंगदाणे, तेलबिया चांगली होतात."
- "यात चांगले पाणी काढणी व्हावी म्हणून खत घालावे लागते."

**३. वालुकामय माती:**
- "ही माती हातात घेतली की खडबडीत वाटते."
- "यातून पाणी लवकर निघून जाते."
- "यामध्ये भाज्या चांगल्या होतात पण वारंवार पाणी द्यावे लागते."

**४. चिकणमाती:**
- "ही माती ओली असताना चिकट वाटते."
- "यात पाणी जास्त काळ राहते."
- "भाताच्या शेतीसाठी ही माती चांगली."

## शिकवण:

राजूला समजले की प्रत्येक मातीचे वेगळे गुणधर्म आहेत. त्यानुसार योग्य पीक निवडले तर चांगले उत्पादन मिळते.

"आता मला कळले आजोबा! मातीची ओळख करून घेऊन त्यानुसार शेती केली तर यश मिळते."

**नैतिक शिकवण:** पारंपरिक ज्ञान आणि आधुनिक विज्ञान यांचा मेळ घालून शेती केली तर समृद्धी येते.
            """,
            'generated_by': 'enhanced_template',
            'language_used': language,
            'content_type': 'story',
            'cultural_elements': ['Maharashtra village setting', 'Traditional farming wisdom', 'Local crop varieties']
        }
    
    # Hindi soil types story
    elif language == 'hindi' and 'soil' in topic.lower():
        content = {
            'main_content': """
# मिट्टी के प्रकार - किसान रवि की कहानी

उत्तर प्रदेश के एक छोटे से गाँव में रवि नाम का एक युवा किसान रहता था। उसने देखा कि उसके खेत के अलग-अलग हिस्सों में फसल अलग तरह से उगती है।

## मुख्य कहानी:

रवि ने अपने दादाजी से पूछा, "दादाजी, एक ही बीज, एक ही पानी देने पर भी फसल अलग क्यों होती है?"

दादाजी ने समझाया, "बेटा, सभी मिट्टी एक जैसी नहीं होती।"

### मिट्टी के प्रकार:

**१. काली मिट्टी:** कपास और गेहूं के लिए अच्छी
**२. लाल मिट्टी:** मूंगफली और बाजरा के लिए उपयुक्त
**३. बलुई मिट्टी:** सब्जियों के लिए अच्छी
**४. चिकनी मिट्टी:** धान की खेती के लिए बेहतरीन

**सीख:** सही मिट्टी की पहचान करके उपयुक्त फसल उगाने से अच्छी पैदावार होती है।
            """,
            'generated_by': 'enhanced_template',
            'language_used': language,
            'content_type': 'story'
        }
    
    # English fallback
    else:
        content = {
            'main_content': f"""
# Educational Story: Understanding {topic.title()}

Once upon a time, in a village in {region}, there lived a curious young farmer who wanted to understand more about {topic}.

The farmer learned that different approaches and understanding lead to better results. Through observation and learning from elders, they discovered the importance of knowledge in their daily work.

**Key Learning:** Traditional wisdom combined with modern understanding leads to success.
            """,
            'generated_by': 'enhanced_template',
            'language_used': language,
            'content_type': 'story'
        }
    
    return content


def generate_enhanced_explanation(topic, region, language, structure, cultural_refs, original_request):
    """Generate enhanced explanation with proper language support."""
    
    if language == 'marathi' and 'soil' in topic.lower():
        content = {
            'main_content': """
# मातीचे प्रकार - तपशीलवार माहिती

महाराष्ट्रात मुख्यतः चार प्रकारची माती आढळते:

## १. काळी माती (रेगूर माती)
- **वैशिष्ट्ये:** काळ्या रंगाची, चिकणमाती
- **गुणधर्म:** पाणी चांगले ठेवते, खनिजांनी भरपूर
- **योग्य पिके:** कापूस, गहू, ज्वारी, बाजरी
- **स्थान:** पश्चिम महाराष्ट्र, विदर्भ

## २. लाल माती
- **वैशिष्ट्ये:** लाल रंग (लोहयुक्त), चांगली निचरा
- **योग्य पिके:** शेंगदाणे, तेलबिया, तूर
- **स्थान:** कोकण, घाट प्रदेश

## ३. वालुकामय माती
- **वैशिष्ट्ये:** वाळू जास्त, हलकी माती
- **गुणधर्म:** पाणी लवकर निघते, हवा चांगली मिळते
- **योग्य पिके:** भाज्या, फळे

## ४. चिकणमाती
- **वैशिष्ट्ये:** चिकट, पाणी जास्त काळ राहते
- **योग्य पिके:** भात, गहू
            """,
            'generated_by': 'enhanced_template',
            'language_used': language,
            'content_type': 'explanation'
        }
    else:
        content = {
            'main_content': f"Detailed explanation about {topic} in {language} for {region} context.",
            'generated_by': 'enhanced_template',
            'language_used': language,
            'content_type': 'explanation'
        }
    
    return content


def generate_enhanced_dialogue(topic, region, language, structure, cultural_refs, original_request):
    """Generate enhanced dialogue with proper language support."""
    
    if language == 'marathi':
        content = {
            'main_content': f"""
# संवाद: {topic} बद्दल चर्चा

**शिक्षक:** आज आपण {topic} बद्दल शिकणार आहोत.

**विद्यार्थी प्रिया:** सर, माझ्या आजोबांना यासंबंधी बरीच माहिती आहे.

**शिक्षक:** खूप छान! पारंपरिक ज्ञान खूप महत्वाचे असते.

**विद्यार्थी अर्जुन:** आम्हाला प्रत्यक्ष दाखवून समजावाल का?

**शिक्षक:** नक्कीच! {region} मध्ये याची अनेक उदाहरणे आहेत.
            """,
            'generated_by': 'enhanced_template',
            'language_used': language,
            'content_type': 'dialogue'
        }
    else:
        content = {
            'main_content': f"Educational dialogue about {topic} in {language}",
            'generated_by': 'enhanced_template',
            'language_used': language,
            'content_type': 'dialogue'
        }
    
    return content


    """Generate template-based educational content as fallback."""
    
    if content_type == 'story':
        return generate_story_template(topic, region, language, structure, cultural_refs, original_request)
    elif content_type == 'explanation':
        return generate_explanation_template(topic, region, language, structure, cultural_refs, original_request)
    elif content_type == 'dialogue':
        return generate_dialogue_template(topic, region, language, structure, cultural_refs, original_request)
    else:
        return generate_story_template(topic, region, language, structure, cultural_refs, original_request)


def generate_story_template(topic, region, language, structure, cultural_refs, original_request):
    
    # Sample story templates based on topic
    if 'soil' in topic.lower() or 'agriculture' in topic.lower():
        content = {
            'introduction': f"In a small village in {region}, there lived a young farmer named Ravi who was curious about the different types of soil on his family's land.",
            'characters': [
                "Ravi - A curious young farmer",
                "Dada (Grandfather) - An experienced farmer with traditional knowledge",
                "Local Agricultural Officer - Modern scientific knowledge"
            ],
            'main_content': """
Ravi noticed that crops grew differently in various parts of his field. In some areas, the wheat was tall and golden, while in others it was shorter and less healthy. Confused, he approached his grandfather.

"Dada, why do our crops grow differently even though we use the same seeds and water?" Ravi asked.

His grandfather smiled and picked up a handful of soil. "Beta, not all soil is the same. Come, let me show you."

They walked to different parts of the field. Dada explained:

"This black soil here is called 'kali mitti' - it's rich in nutrients and holds water well. Perfect for cotton and wheat."

"That reddish soil over there is 'lal mitti' - it's good for groundnuts and millets but needs more care."

"And this sandy soil drains water quickly but is good for vegetables if we add compost."

The next day, the agricultural officer visited their village. She taught them about:
- Sandy soil: Good drainage, needs frequent watering
- Clay soil: Holds water well but can become waterlogged
- Loamy soil: The best mix for most crops
- Black soil: Rich in minerals, excellent for cotton

Ravi learned to test soil by:
1. Feeling its texture between his fingers
2. Observing how water moves through it
3. Looking at the color and composition
4. Understanding which crops grow best in each type
            """,
            'conclusion': "Armed with this knowledge, Ravi planned his next season's crops according to soil types, leading to a much better harvest. He realized that understanding soil is the foundation of successful farming.",
            'moral_lesson': "Knowledge of our land and respect for traditional wisdom, combined with modern science, leads to prosperity."
        }
    else:
        # Generic educational story template
        content = {
            'introduction': f"This is an educational story about {topic} set in {region}.",
            'main_content': f"A story that teaches about {topic} using local examples and cultural context.",
            'conclusion': f"The story concludes with key learnings about {topic}.",
            'moral_lesson': "Learning is best when connected to our everyday experiences."
        }
    
    return content


def generate_explanation_template(topic, region, language, structure, cultural_refs, original_request):
    """Generate explanation-based educational content."""
    
    if 'soil' in topic.lower():
        content = {
            'introduction': f"Let's understand different types of soil found in {region} and across India.",
            'main_content': """
Soil is the foundation of agriculture. Just like we have different types of food for different occasions, our earth has different types of soil for different plants.

**Main Types of Soil:**

1. **Sandy Soil (बलुई मिट्टी)**
   - Feels gritty when you rub it between your fingers
   - Water drains quickly through it
   - Good for: Vegetables like carrots, radishes
   - Challenge: Needs frequent watering
   - Local example: Found in coastal areas of Gujarat and Rajasthan

2. **Clay Soil (चिकनी मिट्टी)**  
   - Feels smooth and sticky when wet
   - Holds water for a long time
   - Good for: Rice cultivation
   - Challenge: Can become waterlogged
   - Local example: Common in parts of West Bengal and Kerala

3. **Black Soil (काली मिट्टी)**
   - Also called 'Regur' or cotton soil
   - Rich in minerals like iron and magnesium
   - Good for: Cotton, wheat, sugarcane
   - Special feature: Expands when wet, contracts when dry
   - Local example: Found in Maharashtra, Gujarat, Madhya Pradesh

4. **Red Soil (लाल मिट्टी)**
   - Gets its color from iron content
   - Good drainage but needs organic matter
   - Good for: Groundnuts, millets, vegetables
   - Local example: Common in Tamil Nadu, Karnataka

5. **Loamy Soil (दोमट मिट्टी)**
   - Perfect mixture of sand, clay, and silt
   - Considered the best soil for most crops
   - Good for: Almost all crops
   - Local example: Found in river valleys and well-managed farms
            """,
            'practical_examples': f"In {region}, farmers traditionally test soil by observing how it behaves during monsoon and summer seasons.",
            'conclusion': "Understanding soil types helps farmers choose the right crops and farming methods, leading to better harvests and sustainable agriculture."
        }
    else:
        content = {
            'introduction': f"Let's learn about {topic} with examples from {region}.",
            'main_content': f"Detailed explanation of {topic} using local context and examples.",
            'conclusion': f"Understanding {topic} helps us in our daily lives and studies."
        }
    
    return content


def generate_dialogue_template(topic, region, language, structure, cultural_refs, original_request):
    """Generate dialogue-based educational content."""
    
    content = {
        'setting': f"A conversation between students and teacher in a village school in {region}",
        'characters': ["Teacher", "Student 1 (Priya)", "Student 2 (Arjun)", "Local Farmer (Guest)"],
        'dialogue': f"""
Teacher: Today we're learning about {topic}. Can anyone tell me what they know about it?

Student 1 (Priya): Ma'am, my father is a farmer, and he says different soils need different care.

Teacher: Excellent observation, Priya! That's exactly what we'll explore today.

Student 2 (Arjun): But ma'am, how do we know which soil is which? They all look like dirt to me!

[Local Farmer enters as a guest speaker]

Farmer Uncle: Beta, let me show you a simple trick my father taught me...

[Continues with educational dialogue about the topic]
        """,
        'key_learnings': f"Key points about {topic} are revealed through natural conversation"
    }
    
    return content
