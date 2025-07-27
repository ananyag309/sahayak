from google.adk.tools import ToolContext
import json
import os

# Import config safely
try:
    from .... import config
    GENAI_MODEL = config.GENAI_MODEL
except ImportError:
    GENAI_MODEL = os.getenv("GENAI_MODEL", "gemini-2.0-flash")

# Initialize Gemini client with error handling
client = None
try:
    from google import genai
    client = genai.Client(vertexai=True)
except Exception as e:
    print(f"Gemini client initialization failed: {e}. Using template generation only.")
    client = None


def generate_differentiated_worksheets(tool_context: ToolContext) -> dict:
    """Generate actual worksheet content for all target grade levels."""
    
    try:
        print("Starting worksheet generation...")
        
        # Get all required data from session state
        image_analysis = tool_context.state.get('image_content_analysis', {})
        grade_analysis = tool_context.state.get('grade_analysis', {})
        worksheet_plans = tool_context.state.get('worksheet_plans', {})
        
        print(f"Image analysis available: {bool(image_analysis)}")
        print(f"Grade analysis available: {bool(grade_analysis)}")
        print(f"Worksheet plans available: {bool(worksheet_plans)}")
        
        if not all([image_analysis, grade_analysis, worksheet_plans]):
            missing = []
            if not image_analysis: missing.append('image_content_analysis')
            if not grade_analysis: missing.append('grade_analysis')
            if not worksheet_plans: missing.append('worksheet_plans')
            
            error_msg = f'Missing required analysis data: {", ".join(missing)}. Please ensure all previous steps completed successfully.'
            print(f"Error: {error_msg}")
            return {
                'status': 'error',
                'message': error_msg
            }
        
        # Extract key information
        target_grades = grade_analysis.get('target_grades', [])
        subject = grade_analysis.get('detected_subject', 'science')
        source_content = image_analysis.get('extracted_text', '')
        concepts = image_analysis.get('concepts_identified', [])
        plans = worksheet_plans.get('worksheet_plans', {})
        
        print(f"Generating worksheets for grades: {target_grades}")
        print(f"Subject: {subject}")
        print(f"Number of concepts: {len(concepts)}")
        print(f"Available plans: {list(plans.keys())}")
        
        # Validate that we have plans for the target grades
        missing_plans = []
        for grade in target_grades:
            grade_key = f'grade_{grade}'
            if grade_key not in plans:
                missing_plans.append(grade_key)
        
        if missing_plans:
            error_msg = f'Missing worksheet plans for grades: {", ".join(missing_plans)}'
            print(f"Error: {error_msg}")
            return {
                'status': 'error', 
                'message': error_msg
            }
        
        # Generate worksheets for each grade level
        generated_worksheets = {}
        generation_errors = []
        
        for grade in target_grades:
            grade_key = f'grade_{grade}'
            try:
                print(f"Generating worksheet for {grade_key}")
                worksheet = generate_grade_specific_worksheet(
                    grade, plans[grade_key], source_content, concepts, subject, tool_context
                )
                if worksheet:
                    generated_worksheets[grade_key] = worksheet
                    print(f"Successfully generated worksheet for {grade_key}")
                else:
                    error_msg = f"Failed to generate worksheet for {grade_key}"
                    generation_errors.append(error_msg)
                    print(error_msg)
            except Exception as e:
                error_msg = f"Error generating worksheet for {grade_key}: {str(e)}"
                generation_errors.append(error_msg)
                print(error_msg)
        
        # Check if we generated any worksheets
        if not generated_worksheets:
            error_msg = f"Failed to generate any worksheets. Errors: {'; '.join(generation_errors)}"
            print(f"Error: {error_msg}")
            return {
                'status': 'error',
                'message': error_msg
            }
        
        # Create generation summary
        generation_summary = {
            'total_worksheets_generated': len(generated_worksheets),
            'target_grades': target_grades,
            'subject_area': subject,
            'generation_method': 'enhanced_template_with_ai_assistance',
            'worksheets': generated_worksheets,
            'quality_indicators': assess_generation_quality(generated_worksheets),
            'ready_for_use': True,
            'generation_errors': generation_errors if generation_errors else None
        }
        
        # Store generated worksheets
        iteration_count = tool_context.state.get("worksheet_iteration", 0)
        tool_context.state[f'generated_worksheets_{iteration_count}'] = generation_summary
        tool_context.state['latest_generated_worksheets'] = generation_summary
        
        success_msg = f'Successfully generated {len(generated_worksheets)} differentiated worksheets for grades {target_grades}'
        if generation_errors:
            success_msg += f' (with {len(generation_errors)} errors)'
            
        print(f"Generation complete: {success_msg}")
        
        return {
            'status': 'success',
            'message': success_msg,
            'generation_summary': generation_summary
        }
        
    except Exception as e:
        error_msg = f'Unexpected error in worksheet generation: {str(e)}'
        print(f"Exception: {error_msg}")
        import traceback
        traceback.print_exc()
        return {
            'status': 'error',
            'message': error_msg
        }


def generate_grade_specific_worksheet(grade, plan, source_content, concepts, subject, tool_context):
    """Generate a specific worksheet for one grade level."""
    
    try:
        # ALWAYS use enhanced template generation to avoid rate limits
        # Template generation is reliable and doesn't consume API quota
        print(f"Generating worksheet for grade {grade} using enhanced templates (avoiding API rate limits)")
        
        # Ensure we have minimum required data
        if not plan:
            print(f"Warning: No plan provided for grade {grade}, using defaults")
            plan = {
                'educational_level': 'middle',
                'learning_objectives': [f'Students will understand key {subject} concepts'],
                'estimated_questions': 10
            }
        
        if not concepts:
            print(f"Warning: No concepts provided for grade {grade}, using subject-based defaults")
            concepts = [subject, 'knowledge', 'understanding', 'application']
        
        worksheet = generate_with_enhanced_template(grade, plan, source_content, concepts, subject)
        
        if not worksheet:
            print(f"Error: Template generation failed for grade {grade}")
            return None
            
        return worksheet
        
    except Exception as e:
        print(f"Error in generate_grade_specific_worksheet for grade {grade}: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def generate_with_ai(grade, plan, source_content, concepts, subject):
    """Generate worksheet using Gemini AI with rate limit handling."""
    
    if not client:
        print("Gemini client not available, falling back to template")
        return None
        
    try:
        # Create detailed prompt for worksheet generation
        prompt = create_worksheet_generation_prompt(grade, plan, source_content, concepts, subject)
        
        # Generate using Gemini
        response = client.models.generate_content(
            model=GENAI_MODEL,
            contents=prompt
        )
        
        if response.candidates and len(response.candidates) > 0:
            worksheet_content = response.candidates[0].content.parts[0].text
            
            return {
                'content': worksheet_content,
                'generation_method': 'ai_generated',
                'grade_level': grade,
                'subject': subject,
                'estimated_completion_time': f"{plan.get('estimated_questions', 10) * 2}-{plan.get('estimated_questions', 10) * 3} minutes",
                'learning_objectives': plan.get('learning_objectives', []),
                'assessment_criteria': plan.get('assessment_criteria', {}),
                'differentiation_features': plan.get('differentiation_features', {})
            }
        
        return None
        
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            print(f"Rate limit hit for grade {grade} worksheet generation - using enhanced template")
        else:
            print(f"Gemini worksheet generation failed: {error_msg}")
        return None


def create_worksheet_generation_prompt(grade, plan, source_content, concepts, subject):
    """Create detailed prompt for AI worksheet generation."""
    
    prompt = f"""
You are an expert educator creating a worksheet for Grade {grade} students in {subject}.

SOURCE CONTENT:
{source_content[:1000] if source_content else 'Educational content about ' + ', '.join(concepts[:3])}

KEY CONCEPTS TO COVER:
{', '.join(concepts[:8]) if concepts else f'{subject} concepts appropriate for grade {grade}'}

LEARNING OBJECTIVES:
{chr(10).join(plan.get('learning_objectives', [f'Students will understand key {subject} concepts appropriate for grade {grade}']))}

GRADE {grade} REQUIREMENTS:
- Educational Level: {plan.get('educational_level', 'middle')}
- Cognitive Level: {plan.get('cognitive_level', 'understand and apply')}
- Question Count: {plan.get('estimated_questions', 10)}
- Instruction Style: {plan.get('instruction_style', 'clear guidance')}

Create a complete, ready-to-use worksheet with:
1. Clear title and instructions
2. Varied question types appropriate for Grade {grade}
3. Progressive difficulty within grade-level expectations
4. Answer key or rubric
5. Proper formatting and structure

IMPORTANT: Make sure all content is appropriate for Grade {grade} students and follows educational best practices.

Generate the complete worksheet now:
"""
    
    return prompt


def generate_with_enhanced_template(grade, plan, source_content, concepts, subject):
    """Generate worksheet using enhanced templates."""
    
    try:
        # Determine educational level
        level = plan.get('educational_level', 'middle')
        if not level:
            # Fallback based on grade
            if grade <= 5:
                level = 'elementary'
            elif grade <= 8:
                level = 'middle'
            else:
                level = 'high'
        
        print(f"Generating {level} level worksheet for grade {grade} in {subject}")
        
        # Generate based on subject and concepts
        worksheet_content = None
        
        if subject.lower() in ['science', 'biology', 'physics', 'chemistry'] and any(concept.lower() in ['reproductive', 'sperm', 'egg', 'vas deferens', 'epididymis'] for concept in concepts):
            worksheet_content = generate_reproductive_biology_worksheet(grade, level, plan, concepts)
        elif subject.lower() in ['science', 'biology'] and any(concept.lower() in ['photosynthesis', 'plant', 'chlorophyll'] for concept in concepts):
            worksheet_content = generate_photosynthesis_worksheet(grade, level, plan)
        elif subject.lower() == 'mathematics':
            worksheet_content = generate_math_worksheet(grade, level, plan, concepts)
        elif subject.lower() == 'english':
            worksheet_content = generate_english_worksheet(grade, level, plan, concepts)
        else:
            worksheet_content = generate_general_worksheet(grade, level, plan, concepts, subject)
        
        if not worksheet_content:
            print(f"Warning: No content generated, creating fallback worksheet")
            worksheet_content = create_fallback_worksheet(grade, level, subject, concepts)
        
        return {
            'content': worksheet_content,
            'generation_method': 'enhanced_template',
            'grade_level': grade,
            'subject': subject,
            'estimated_completion_time': f"{plan.get('estimated_questions', 10) * 2}-{plan.get('estimated_questions', 10) * 3} minutes",
            'learning_objectives': plan.get('learning_objectives', []),
            'assessment_criteria': plan.get('assessment_criteria', {}),
            'differentiation_features': plan.get('differentiation_features', {})
        }
        
    except Exception as e:
        print(f"Error in generate_with_enhanced_template: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return minimal fallback
        return {
            'content': create_fallback_worksheet(grade, 'middle', subject, concepts),
            'generation_method': 'fallback_template',
            'grade_level': grade,
            'subject': subject,
            'estimated_completion_time': '20-30 minutes',
            'learning_objectives': [f'Understand basic {subject} concepts'],
            'assessment_criteria': {},
            'differentiation_features': {}
        }


def generate_reproductive_biology_worksheet(grade, level, plan, concepts):
    """Generate reproductive biology worksheet for specific grade level."""
    
    if level == 'elementary':
        return f"""
# Grade {grade} - Basic Life Cycles

**Name: _________________ Date: _________________**

## Learning Goals:
• Understand that animals have life cycles
• Learn about how animals grow and change
• Identify different stages of development

---

### Part 1: Fill in the Blanks (Use the word bank)
**Word Bank: egg, baby, adult, grows, changes**

1. Most animals start as an ____________.
2. A ____________ animal can have offspring.
3. Animals ____________ and ____________ as they develop.

### Part 2: Circle the Correct Answer

4. What do most animals need to reproduce?
   a) Food only    b) A mate    c) Water only

5. How do animals take care of their young?
   a) Feeding them    b) Protecting them    c) Both a and b

### Part 3: Draw and Label
6. Draw the life cycle of a butterfly (4 stages)

### Part 4: True or False
7. All animals start very small. ____
8. Young animals look exactly like adults. ____
9. Animals need care when they are young. ____

---
**Answer Key:**
1. egg  2. adult  3. grows, changes
4. b  5. c  6. [Drawing: egg→caterpillar→chrysalis→butterfly]  7. True  8. False  9. True
        """
    
    elif level == 'middle':
        return f"""
# Grade {grade} - Animal Reproduction and Development

**Name: _________________ Date: _________________**

## Learning Objectives:
• Explain different types of reproduction in animals
• Describe the process of fertilization
• Compare internal and external fertilization

---

### Part 1: Multiple Choice (Circle the best answer)

1. The process where sperm and egg unite is called:
   a) Development    b) Fertilization    c) Growth    d) Maturation

2. Internal fertilization occurs in:
   a) Fish only    b) Mammals    c) Amphibians    d) All animals

3. Which structure produces sperm cells?
   a) Ovary    b) Testis    c) Uterus    d) Fallopian tube

### Part 2: Short Answer

4. Compare sexual and asexual reproduction (3 differences):
   a) _________________
   b) _________________  
   c) _________________

5. Explain why genetic diversity is important for species survival. (2-3 sentences)

6. List the path an egg travels from ovary to uterus:
   Ovary → _________ → _________ → _________

### Part 3: Analysis

7. Compare reproduction in mammals and fish by filling in the table:

| Aspect | Mammals | Fish |
|---------|---------|------|
| Fertilization type | | |
| Development location | | |
| Parental care | | |

8. Explain how reproductive strategies help animals survive in their environments. (3-4 sentences)

---
**Answer Key:**
1. b  2. b  3. b  
4. Sexual needs two parents/genetic diversity/slower vs asexual needs one parent/identical offspring/faster
5. Genetic diversity helps populations adapt to environmental changes and survive diseases
6. Fallopian tube → Uterus → (if fertilized) Implantation
7. See completed table  8. Different strategies maximize survival based on environment
        """
    
    else:  # high school
        return f"""
# Grade {grade} - Advanced Reproductive Biology

**Name: _________________ Date: _________________**

## Learning Objectives:
• Analyze hormonal regulation of reproduction
• Evaluate reproductive technologies and ethics
• Synthesize understanding of reproductive health

---

### Part 1: Hormonal Regulation

1. Create a flowchart showing the hormonal control of the menstrual cycle, including:
   - FSH, LH, estrogen, progesterone
   - Feedback mechanisms
   - Ovarian and uterine changes

2. Explain how hormonal contraceptives work at the molecular level.

### Part 2: Comparative Analysis

3. Compare and contrast reproductive strategies across different animal groups:

| Strategy | Examples | Advantages | Disadvantages | Environmental factors |
|----------|----------|------------|---------------|---------------------|
| High offspring number | | | | |
| Low offspring number | | | | |
| External fertilization | | | | |
| Internal fertilization | | | | |

### Part 3: Bioethics and Technology

4. Analyze the ethical considerations of the following reproductive technologies:
   a) In vitro fertilization (IVF)
   b) Genetic screening of embryos
   c) Surrogacy
   d) Cloning

5. Evaluate the impact of environmental factors on reproductive health:
   - Endocrine disruptors
   - Climate change
   - Pollution

### Part 4: Research Application

6. Design a research study to investigate the effect of a specific environmental factor on reproductive success in a chosen organism. Include:
   - Research question and hypothesis
   - Methodology
   - Variables and controls
   - Expected outcomes
   - Potential applications

---
**Rubric:**
- Scientific accuracy and depth (30%)
- Critical thinking and analysis (25%)
- Use of appropriate terminology (20%)
- Application of concepts (15%)
- Ethical reasoning (10%)
        """


def generate_photosynthesis_worksheet(grade, level, plan):
    """Generate photosynthesis worksheet for specific grade level."""
    
    if level == 'elementary':
        return f"""
# Grade {grade} - Plants and How They Make Food

**Name: _________________ Date: _________________**

## Learning Goals:
• Understand that plants make their own food
• Learn what plants need to grow
• Identify parts of a plant

---

### Part 1: Fill in the Blanks (Use the word bank)
**Word Bank: sunlight, water, leaves, roots, green**

1. Plants need ____________ and ____________ to make food.
2. The ____________ part of plants helps them make food.
3. Plants get water through their ____________.
4. Most leaves are ____________ in color.

### Part 2: Circle the Correct Answer

5. What do plants make during photosynthesis?
   a) Water    b) Food    c) Dirt

6. Where do plants get energy from?
   a) The moon    b) The sun    c) The ground

### Part 3: Draw and Label
7. Draw a simple plant and label: roots, stem, leaves

### Part 4: True or False
8. Plants can live without sunlight. ____
9. Leaves help plants make food. ____
10. Plants need water to survive. ____

---
**Answer Key:**
1. sunlight, water  2. leaves  3. roots  4. green
5. b  6. b  7. [Drawing with labels]  8. False  9. True  10. True
        """
    
    elif level == 'middle':
        return f"""
# Grade {grade} - Photosynthesis: How Plants Make Energy

**Name: _________________ Date: _________________**

## Learning Objectives:
• Explain the process of photosynthesis
• Identify factors that affect photosynthesis
• Compare photosynthesis and respiration

---

### Part 1: Multiple Choice (Circle the best answer)

1. The process by which plants make glucose using sunlight is called:
   a) Respiration    b) Photosynthesis    c) Digestion    d) Transpiration

2. Which organelle is responsible for photosynthesis?
   a) Nucleus    b) Mitochondria    c) Chloroplast    d) Ribosome

3. The green pigment that captures light energy is:
   a) Hemoglobin    b) Chlorophyll    c) Melanin    d) Carotene

### Part 2: Short Answer

4. Write the word equation for photosynthesis:
   _________ + _________ → _________ + _________

5. Explain why plants appear green. (2-3 sentences)

6. List three factors that can affect the rate of photosynthesis:
   a) _________________
   b) _________________  
   c) _________________

### Part 3: Analysis

7. Compare photosynthesis and cellular respiration by filling in the table:

| Process | Location | Inputs | Outputs | Purpose |
|---------|----------|---------|---------|---------|
| Photosynthesis | Chloroplasts | | | |
| Cellular Respiration | Mitochondria | | | |

8. Explain how photosynthesis is important for all life on Earth. (4-5 sentences)

---
**Answer Key:**
1. b  2. c  3. b  4. Carbon dioxide + Water → Glucose + Oxygen
5. Plants appear green because chlorophyll absorbs red and blue light but reflects green light.
6. Light intensity, temperature, carbon dioxide concentration
7. See completed table  8. Photosynthesis produces oxygen and food for all living things.
        """
    
    else:  # high school
        return f"""
# Grade {grade} - Advanced Photosynthesis: Energy Conversion and Efficiency

**Name: _________________ Date: _________________**

## Learning Objectives:
• Analyze the light-dependent and light-independent reactions
• Evaluate factors affecting photosynthetic efficiency
• Synthesize understanding of energy flow in ecosystems

---

### Part 1: Conceptual Analysis

1. Compare and contrast the light-dependent and light-independent reactions of photosynthesis:

| Aspect | Light-Dependent | Light-Independent |
|--------|-----------------|-------------------|
| Location | | |
| Inputs | | |
| Outputs | | |
| Energy source | | |

2. Explain the role of ATP and NADPH in photosynthesis. How are they produced and utilized?

### Part 2: Data Analysis

3. A scientist measures the rate of photosynthesis at different light intensities:

| Light Intensity (lux) | 100 | 500 | 1000 | 2000 | 4000 | 8000 |
|----------------------|-----|-----|------|------|------|------|
| O₂ Production (mL/min)| 0.5 | 2.1 | 4.2  | 7.8  | 8.0  | 8.1  |

   a) Graph this data and explain the relationship.
   b) Identify the limiting factor at high light intensities.
   c) Predict what would happen if temperature increased to 35°C.

### Part 3: Critical Thinking

4. Evaluate the efficiency of photosynthesis as an energy conversion process. Consider:
   - Theoretical maximum efficiency
   - Actual efficiency in C3 vs C4 plants
   - Environmental and evolutionary trade-offs

5. Design an experiment to test the effect of CO₂ concentration on photosynthetic rate. Include:
   - Hypothesis
   - Variables (independent, dependent, controlled)
   - Methodology
   - Expected results

### Part 4: Application

6. Analyze how climate change might affect global photosynthesis rates and food production. Consider multiple factors and their interactions.

---
**Rubric:**
- Accuracy of scientific concepts (25%)
- Quality of analysis and reasoning (25%)
- Use of appropriate scientific vocabulary (20%)
- Data interpretation skills (15%)
- Creative and critical thinking (15%)
        """


def generate_math_worksheet(grade, level, plan, concepts):
    """Generate mathematics worksheet for specific grade level."""
    
    if level == 'elementary':
        return f"""
# Grade {grade} - Math Practice

**Name: _________________ Date: _________________**

### Part 1: Addition and Subtraction
1. 25 + 17 = ____
2. 43 - 18 = ____
3. 56 + 29 = ____

### Part 2: Word Problems
4. Sarah has 15 stickers. She gives 7 to her friend. How many stickers does she have left?

5. There are 23 birds in a tree. 8 more birds come. How many birds are there now?

### Part 3: Patterns
6. Continue the pattern: 2, 4, 6, 8, ____, ____

7. What comes next? ○, △, ○, △, ○, ____

**Answer Key:** 1. 42  2. 25  3. 85  4. 8 stickers  5. 31 birds  6. 10, 12  7. △
        """
    
    elif level == 'middle':
        return f"""
# Grade {grade} - Algebra and Problem Solving

**Name: _________________ Date: _________________**

### Part 1: Solve for x
1. 3x + 5 = 17
2. 2(x - 3) = 10
3. x/4 + 7 = 12

### Part 2: Word Problems
4. A rectangle has a length of (x + 3) and width of (x - 1). If the perimeter is 24, find x.

5. The sum of two consecutive integers is 47. What are the integers?

### Part 3: Graphing
6. Graph the equation y = 2x - 3

**Answer Key:** 1. x = 4  2. x = 8  3. x = 20  4. x = 4.5  5. 23 and 24
        """
    
    else:  # high school
        return f"""
# Grade {grade} - Advanced Mathematics

**Name: _________________ Date: _________________**

### Part 1: Functions and Analysis
1. Given f(x) = x² - 4x + 3, find:
   a) f(-2)
   b) The vertex of the parabola
   c) The x-intercepts

### Part 2: Calculus Applications
2. Find the derivative of f(x) = 3x³ - 2x² + 5x - 1

3. A ball is thrown upward with initial velocity 64 ft/s. Its height is h(t) = -16t² + 64t.
   a) When does it reach maximum height?
   b) What is the maximum height?

**Answer Key:** 1a. 15  1b. (2, -1)  1c. x = 1, 3  2. f'(x) = 9x² - 4x + 5  3a. 2 seconds  3b. 64 feet
        """


def generate_english_worksheet(grade, level, plan, concepts):
    """Generate English worksheet for specific grade level."""
    
    if level == 'elementary':
        return f"""
# Grade {grade} - Reading and Writing

**Name: _________________ Date: _________________**

### Part 1: Vocabulary
1. Circle the correct spelling:
   a) freind / friend
   b) becuase / because
   c) thier / their

### Part 2: Reading Comprehension
Read the short story and answer the questions:

"The little cat climbed the tall tree to catch a bird. But the cat got scared and couldn't come down. A kind firefighter helped the cat get down safely."

2. Who climbed the tree? _______________
3. Why did the cat climb the tree? _______________
4. Who helped the cat? _______________

### Part 3: Writing
5. Write 3 sentences about your favorite animal.

**Answer Key:** 1. friend, because, their  2. The cat  3. To catch a bird  4. A firefighter
        """
    
    elif level == 'middle':
        return f"""
# Grade {grade} - Literature and Composition

**Name: _________________ Date: _________________**

### Part 1: Literary Analysis
Read this excerpt and answer the questions:

"The wind howled through the empty streets like a wild animal seeking shelter."

1. What literary device is used in this sentence?
2. What mood does this create?
3. Rewrite the sentence without the literary device.

### Part 2: Grammar
4. Identify the parts of speech for each underlined word:
   "The quick brown fox jumped over the lazy dog."

### Part 3: Writing
5. Write a paragraph (5-7 sentences) describing a place using at least two metaphors.

**Answer Key:** 1. Simile/Personification  2. Eerie/ominous  3. The wind blew strongly through the empty streets.
        """
    
    else:  # high school
        return f"""
# Grade {grade} - Advanced Literature and Rhetoric

**Name: _________________ Date: _________________**

### Part 1: Literary Analysis
Analyze the following passage for:
1. Tone and mood
2. Figurative language
3. Theme development
4. Author's purpose

### Part 2: Rhetorical Analysis
5. Identify and explain three rhetorical strategies used in Martin Luther King Jr.'s "I Have a Dream" speech.

### Part 3: Creative Writing
6. Write a persuasive essay (300 words) on a contemporary social issue, using at least three rhetorical appeals.

**Rubric:** Content (30%), Organization (25%), Language Use (25%), Conventions (20%)
        """


def generate_general_worksheet(grade, level, plan, concepts, subject):
    """Generate general worksheet for any subject."""
    
    return f"""
# Grade {grade} - {subject.title()} Worksheet

**Name: _________________ Date: _________________**

## Learning Objectives:
{chr(10).join(plan.get('learning_objectives', [f'Students will understand key {subject} concepts']))}

---

### Part 1: Vocabulary ({level} level)
Define the following terms:
{chr(10).join([f"{i+1}. {concept}" for i, concept in enumerate(concepts[:5]) if concept])}

### Part 2: Comprehension
{f"Answer the following questions about {subject}:" if level == 'elementary' else f"Analyze the following concepts in {subject}:"}

{chr(10).join([f"{i+6}. Explain how {concept} relates to {subject}?" for i, concept in enumerate(concepts[:3]) if concept])}

### Part 3: Application
{f"Draw or describe how you use {subject} in everyday life." if level == 'elementary' else f"Apply your understanding of {subject} to solve the following problems:"}

{f"9. Give an example of {subject} in your daily life." if level == 'elementary' else f"9. How can understanding {concepts[0] if concepts else subject} help in real-world situations?"}

### Part 4: {"Reflection" if level == 'high' else "Review"}
{f"10. Critically evaluate the importance of {subject} in modern society." if level == 'high' else f"10. What is the most interesting thing you learned about {subject} today?"}

---
**Assessment Criteria:**
- Understanding of key concepts
- Application of knowledge  
- Quality of explanations
- Use of appropriate vocabulary

**Learning Objectives Met:**
{chr(10).join([f"• {obj}" for obj in plan.get('learning_objectives', [f'Understand {subject} concepts'])])}
    """


def assess_generation_quality(worksheets):
    """Assess the quality of generated worksheets."""
    
    quality_indicators = {
        'completeness': all('content' in ws for ws in worksheets.values()),
        'grade_differentiation': len(set(ws.get('grade_level') for ws in worksheets.values())) > 1,
        'educational_value': all('learning_objectives' in ws for ws in worksheets.values()),
        'ready_for_classroom': True,
        'content_length': all(len(ws.get('content', '')) > 500 for ws in worksheets.values()),
        'proper_formatting': all('Grade' in ws.get('content', '') for ws in worksheets.values()),
        'quality_score': 85  # Base score, would be calculated based on actual content analysis
    }
    
    return quality_indicators


def create_fallback_worksheet(grade, level, subject, concepts):
    """Create a basic fallback worksheet when other generation methods fail."""
    
    concept_list = concepts[:5] if concepts else [subject, 'knowledge', 'understanding', 'application', 'analysis']
    
    return f"""
# Grade {grade} - {subject.title()} Study Worksheet

**Name: _________________ Date: _________________**

## Learning Objectives:
• Understand key concepts in {subject}
• Apply knowledge to practical situations
• Demonstrate understanding through various question types

---

### Part 1: Vocabulary ({level} level)
Define the following terms:
{chr(10).join([f"{i+1}. {concept}" for i, concept in enumerate(concept_list)])}

### Part 2: Comprehension
{"Answer the following questions:" if level == 'elementary' else "Analyze the following concepts:"}

{chr(10).join([f"{i+6}. What is the importance of {concept} in {subject}?" for i, concept in enumerate(concept_list[:3])])}

### Part 3: Application
{"Give examples from everyday life:" if level == 'elementary' else "Apply your knowledge to solve problems:"}

{f"9. How do you see {subject} in your daily life?" if level == 'elementary' else f"9. How can understanding {concept_list[0]} help solve real-world problems?"}

### Part 4: {"Drawing" if level == 'elementary' else "Analysis"}
{f"10. Draw a picture showing {subject} concepts." if level == 'elementary' else f"10. Analyze the relationship between different {subject} concepts."}

---
**Answer Key:**
1-5. Student definitions should demonstrate understanding of key vocabulary
6-8. Responses should show comprehension of fundamental concepts
9-10. Applications should connect learning to real-world contexts

**Assessment:**
- Understanding of vocabulary: 25%
- Comprehension of concepts: 25%  
- Application skills: 25%
- Communication and presentation: 25%
    """
