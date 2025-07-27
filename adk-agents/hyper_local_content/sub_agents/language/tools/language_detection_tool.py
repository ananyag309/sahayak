from google.adk.tools import ToolContext
import re
import json


def detect_language_and_context(request_text: str, tool_context: ToolContext) -> dict:
    """Detects language and extracts cultural context from the request."""
    
    # Language detection patterns for Indian scripts
    language_patterns = {
        'hindi': r'[\u0900-\u097F]',
        'marathi': r'[\u0900-\u097F]',  # Similar to Hindi script (Devanagari)
        'gujarati': r'[\u0A80-\u0AFF]',
        'tamil': r'[\u0B80-\u0BFF]',
        'telugu': r'[\u0C00-\u0C7F]',
        'kannada': r'[\u0C80-\u0CFF]',
        'malayalam': r'[\u0D00-\u0D7F]',
        'bengali': r'[\u0980-\u09FF]',
        'punjabi': r'[\u0A00-\u0A7F]',
    }
    
    # Marathi-specific keywords to distinguish from Hindi
    marathi_keywords = ['मराठी', 'शेतकरी', 'कहाणी', 'समजावून', 'धडा', 'मराठीत']
    hindi_keywords = ['किसान', 'कहानी', 'समझाना', 'हिंदी', 'हिंदीमें']
    
    detected_language = 'english'  # default
    script_confidence = 0
    
    # Check for script patterns
    for lang, pattern in language_patterns.items():
        matches = len(re.findall(pattern, request_text))
        if matches > script_confidence:
            script_confidence = matches
            detected_language = lang
    
    # If Devanagari script detected, check for Marathi vs Hindi specific keywords
    if detected_language in ['hindi', 'marathi'] and script_confidence > 0:
        marathi_score = sum(1 for keyword in marathi_keywords if keyword in request_text)
        hindi_score = sum(1 for keyword in hindi_keywords if keyword in request_text)
        
        if marathi_score > hindi_score:
            detected_language = 'marathi'
        elif hindi_score > marathi_score:
            detected_language = 'hindi'
        # If equal or both zero, check the request pattern
        elif 'marathi' in request_text.lower() or 'मराठी' in request_text:
            detected_language = 'marathi'
    
    # Detect content type based on keywords
    content_type = 'story'  # default
    content_keywords = {
        'story': ['story', 'कहानी', 'कथा', 'किस्सा', 'कहाणी'],
        'explanation': ['explain', 'समझाओ', 'समझाना', 'स्पष्ट', 'समजावून'],
        'dialogue': ['dialogue', 'बातचीत', 'संवाद', 'चर्चा'],
        'lesson': ['lesson', 'पाठ', 'शिक्षा', 'धडा'],
        'example': ['example', 'उदाहरण', 'मिसाल', 'नमुना']
    }
    
    request_lower = request_text.lower()
    for ctype, keywords in content_keywords.items():
        for keyword in keywords:
            if keyword in request_lower:
                content_type = ctype
                break
    
    # Extract educational topic
    educational_topic = "general"
    if any(word in request_lower for word in ['soil', 'मिट्टी', 'माती']):
        educational_topic = "agriculture/soil_science"
    elif any(word in request_lower for word in ['farmer', 'किसान', 'शेतकरी']):
        educational_topic = "agriculture"
    elif any(word in request_lower for word in ['math', 'गणित', 'mathematics']):
        educational_topic = "mathematics"
    elif any(word in request_lower for word in ['science', 'विज्ञान', 'विज्ञान']):
        educational_topic = "science"
    
    # Determine cultural region based on language
    cultural_regions = {
        'hindi': 'North India',
        'marathi': 'Maharashtra',
        'gujarati': 'Gujarat',
        'tamil': 'Tamil Nadu',
        'telugu': 'Andhra Pradesh/Telangana',
        'kannada': 'Karnataka',
        'malayalam': 'Kerala',
        'bengali': 'West Bengal',
        'punjabi': 'Punjab',
        'english': 'India (General)'
    }
    
    context = {
        'detected_language': detected_language,
        'content_type': content_type,
        'educational_topic': educational_topic,
        'original_request': request_text,
        'cultural_region': cultural_regions.get(detected_language, 'India'),
        'script_confidence': script_confidence,
        'target_audience': 'students'  # can be enhanced
    }
    
    # Store in session state
    tool_context.state['language_context'] = context
    
    return {
        'status': 'success',
        'message': f'Detected language: {detected_language}, Content type: {content_type}, Topic: {educational_topic}',
        'context': context
    }
