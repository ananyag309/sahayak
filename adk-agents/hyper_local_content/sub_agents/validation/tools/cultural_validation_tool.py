from google.adk.tools import ToolContext
import json


def validate_cultural_appropriateness(tool_context: ToolContext) -> dict:
    """Validates cultural appropriateness and educational quality of generated content."""
    
    try:
        generated_content = tool_context.state.get('latest_generated_content', {})
        cultural_guidelines = tool_context.state.get('cultural_guidelines', {})
        language_context = tool_context.state.get('language_context', {})
        
        if not generated_content:
            return {
                'status': 'error',
                'message': 'No generated content found for validation'
            }
        
        # Validation criteria based on cultural guidelines
        validation_results = {}
        total_score = 0
        max_score = 50  # 10 criteria × 5 points each
        
        # 1. Language Appropriateness (5 points)
        language_score = evaluate_language_appropriateness(generated_content, language_context)
        validation_results['Language Appropriateness'] = {
            'score': language_score,
            'max_score': 5,
            'feedback': get_language_feedback(language_score)
        }
        total_score += language_score
        
        # 2. Cultural Sensitivity (5 points)
        cultural_score = evaluate_cultural_sensitivity(generated_content, language_context)
        validation_results['Cultural Sensitivity'] = {
            'score': cultural_score,
            'max_score': 5,
            'feedback': get_cultural_feedback(cultural_score)
        }
        total_score += cultural_score
        
        # 3. Educational Value (5 points)
        educational_score = evaluate_educational_value(generated_content)
        validation_results['Educational Value'] = {
            'score': educational_score,
            'max_score': 5,
            'feedback': get_educational_feedback(educational_score)
        }
        total_score += educational_score
        
        # 4. Local Context (5 points)
        local_score = evaluate_local_context(generated_content, language_context)
        validation_results['Local Context'] = {
            'score': local_score,
            'max_score': 5,
            'feedback': get_local_context_feedback(local_score)
        }
        total_score += local_score
        
        # 5. Inclusivity (5 points)
        inclusivity_score = evaluate_inclusivity(generated_content)
        validation_results['Inclusivity'] = {
            'score': inclusivity_score,
            'max_score': 5,
            'feedback': get_inclusivity_feedback(inclusivity_score)
        }
        total_score += inclusivity_score
        
        # 6. Accuracy (5 points)
        accuracy_score = evaluate_accuracy(generated_content)
        validation_results['Accuracy'] = {
            'score': accuracy_score,
            'max_score': 5,
            'feedback': get_accuracy_feedback(accuracy_score)
        }
        total_score += accuracy_score
        
        # 7. Age Appropriateness (5 points)
        age_score = evaluate_age_appropriateness(generated_content)
        validation_results['Age Appropriateness'] = {
            'score': age_score,
            'max_score': 5,
            'feedback': get_age_feedback(age_score)
        }
        total_score += age_score
        
        # 8. Regional Relevance (5 points)
        regional_score = evaluate_regional_relevance(generated_content, language_context)
        validation_results['Regional Relevance'] = {
            'score': regional_score,
            'max_score': 5,
            'feedback': get_regional_feedback(regional_score)
        }
        total_score += regional_score
        
        # 9. Practical Application (5 points)
        practical_score = evaluate_practical_application(generated_content)
        validation_results['Practical Application'] = {
            'score': practical_score,
            'max_score': 5,
            'feedback': get_practical_feedback(practical_score)
        }
        total_score += practical_score
        
        # 10. Engagement (5 points)
        engagement_score = evaluate_engagement(generated_content)
        validation_results['Engagement'] = {
            'score': engagement_score,
            'max_score': 5,
            'feedback': get_engagement_feedback(engagement_score)
        }
        total_score += engagement_score
        
        # Store validation results
        validation_summary = {
            'total_score': total_score,
            'max_possible_score': max_score,
            'percentage': round((total_score / max_score) * 100, 2),
            'detailed_scores': validation_results,
            'overall_assessment': get_overall_assessment(total_score, max_score),
            'recommendations': get_improvement_recommendations(validation_results)
        }
        
        tool_context.state['validation_results'] = validation_summary
        
        return {
            'status': 'success',
            'message': f'Content validation completed. Score: {total_score}/{max_score} ({validation_summary["percentage"]}%)',
            'validation_results': validation_summary
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Error validating content: {str(e)}'
        }


def evaluate_language_appropriateness(content, language_context):
    """Evaluate if language is appropriate for target audience."""
    content_text = str(content.get('main_content', ''))
    target_language = language_context.get('detected_language', 'english')
    
    # Check for age-appropriate vocabulary and complexity
    score = 4  # Default good score
    
    # Simple heuristics for language appropriateness
    if len(content_text) > 0:
        avg_sentence_length = len(content_text.split()) / max(content_text.count('.'), 1)
        if avg_sentence_length > 25:  # Too complex
            score -= 1
        if any(word in content_text.lower() for word in ['complex', 'advanced', 'sophisticated']):
            score -= 1
    
    return max(0, min(5, score))


def evaluate_cultural_sensitivity(content, language_context):
    """Evaluate cultural sensitivity and appropriateness."""
    cultural_region = language_context.get('cultural_region', 'India')
    content_text = str(content)
    
    score = 5  # Start with full score
    
    # Check for stereotypes or inappropriate references
    problematic_terms = ['backward', 'primitive', 'uneducated', 'poor farmers']
    for term in problematic_terms:
        if term.lower() in content_text.lower():
            score -= 2
    
    # Check for positive cultural references
    positive_indicators = ['traditional knowledge', 'local wisdom', 'cultural practices']
    for indicator in positive_indicators:
        if indicator.lower() in content_text.lower():
            score = min(5, score + 1)
    
    return max(0, min(5, score))


def evaluate_educational_value(content):
    """Evaluate educational effectiveness."""
    learning_objectives = content.get('learning_objectives', [])
    main_content = str(content.get('main_content', ''))
    
    score = 3  # Base score
    
    # Check for clear learning objectives
    if learning_objectives and len(learning_objectives) > 0:
        score += 1
    
    # Check for structured content
    if any(keyword in main_content.lower() for keyword in ['example', 'for instance', 'let me explain']):
        score += 1
    
    # Check for practical examples
    if any(keyword in main_content.lower() for keyword in ['real-world', 'practical', 'everyday']):
        score += 1
    
    return max(0, min(5, score))


def evaluate_local_context(content, language_context):
    """Evaluate use of local context and examples."""
    cultural_region = language_context.get('cultural_region', 'India')
    content_text = str(content)
    
    score = 3  # Base score
    
    # Check for local references
    local_indicators = ['village', 'local', 'regional', cultural_region.lower()]
    for indicator in local_indicators:
        if indicator in content_text.lower():
            score += 1
            break
    
    # Check for Indian context
    indian_context = ['indian', 'india', 'dada', 'beta', 'uncle', 'aunty']
    for context in indian_context:
        if context in content_text.lower():
            score += 1
            break
    
    return max(0, min(5, score))


def evaluate_inclusivity(content):
    """Evaluate inclusivity and diversity representation."""
    content_text = str(content).lower()
    score = 4  # Default good score
    
    # Check for diverse character representation
    if 'priya' in content_text and 'arjun' in content_text:  # Mixed gender names
        score += 1
    
    # Penalize for exclusive language
    exclusive_terms = ['only boys', 'only girls', 'men should', 'women should']
    for term in exclusive_terms:
        if term in content_text:
            score -= 2
    
    return max(0, min(5, score))


def evaluate_accuracy(content):
    """Evaluate factual accuracy."""
    # This is a simplified check - in practice, would need domain expertise
    score = 4  # Assume good accuracy by default
    
    educational_topic = content.get('educational_topic', '')
    if 'soil' in educational_topic.lower():
        main_content = str(content.get('main_content', '')).lower()
        # Check for correct soil types
        if 'sandy' in main_content and 'clay' in main_content and 'loamy' in main_content:
            score += 1
    
    return max(0, min(5, score))


def evaluate_age_appropriateness(content):
    """Evaluate if content is appropriate for target age group."""
    complexity_level = content.get('complexity_level', 'moderate')
    score = 4  # Default good score
    
    if complexity_level == 'simple':
        score += 1
    elif complexity_level == 'complex':
        score -= 1
    
    return max(0, min(5, score))


def evaluate_regional_relevance(content, language_context):
    """Evaluate regional relevance and local examples."""
    cultural_region = language_context.get('cultural_region', 'India')
    cultural_elements = content.get('cultural_elements', [])
    
    score = 3  # Base score
    
    if cultural_elements and len(cultural_elements) > 0:
        score += 2
    
    return max(0, min(5, score))


def evaluate_practical_application(content):
    """Evaluate practical application and real-world relevance."""
    content_text = str(content).lower()
    score = 3  # Base score
    
    practical_indicators = ['practical', 'real-world', 'everyday', 'daily life', 'application']
    for indicator in practical_indicators:
        if indicator in content_text:
            score += 1
            break
    
    if 'example' in content_text:
        score += 1
    
    return max(0, min(5, score))


def evaluate_engagement(content):
    """Evaluate engagement and interest level."""
    content_text = str(content).lower()
    score = 3  # Base score
    
    # Check for engaging elements
    engaging_elements = ['story', 'dialogue', 'characters', 'conversation', 'interesting']
    for element in engaging_elements:
        if element in content_text:
            score += 1
            break
    
    # Check for interactive elements
    if any(word in content_text for word in ['question', 'ask', 'think', 'observe']):
        score += 1
    
    return max(0, min(5, score))


def get_language_feedback(score):
    """Get feedback for language appropriateness score."""
    if score >= 4:
        return "Language is appropriate and clear for the target audience."
    elif score >= 3:
        return "Language is mostly appropriate but could be simplified in some areas."
    else:
        return "Language needs simplification for better accessibility."


def get_cultural_feedback(score):
    """Get feedback for cultural sensitivity score."""
    if score >= 4:
        return "Content demonstrates good cultural sensitivity and respect."
    elif score >= 3:
        return "Content is culturally appropriate with minor areas for improvement."
    else:
        return "Content needs better cultural sensitivity and local context."


def get_educational_feedback(score):
    """Get feedback for educational value score."""
    if score >= 4:
        return "Strong educational value with clear learning objectives."
    elif score >= 3:
        return "Good educational content with some areas for enhancement."
    else:
        return "Educational value needs strengthening with clearer objectives."


def get_local_context_feedback(score):
    """Get feedback for local context score."""
    if score >= 4:
        return "Excellent use of local context and regional examples."
    elif score >= 3:
        return "Good local context with room for more regional specificity."
    else:
        return "Needs more local context and regional relevance."


def get_inclusivity_feedback(score):
    """Get feedback for inclusivity score."""
    if score >= 4:
        return "Content is inclusive and represents diversity well."
    elif score >= 3:
        return "Generally inclusive with minor improvements possible."
    else:
        return "Needs better representation of diversity and inclusivity."


def get_accuracy_feedback(score):
    """Get feedback for accuracy score."""
    if score >= 4:
        return "Content appears factually accurate and well-researched."
    elif score >= 3:
        return "Generally accurate with some areas needing verification."
    else:
        return "Accuracy needs improvement and fact-checking."


def get_age_feedback(score):
    """Get feedback for age appropriateness score."""
    if score >= 4:
        return "Well-suited for the target age group."
    elif score >= 3:
        return "Mostly age-appropriate with minor adjustments needed."
    else:
        return "Needs better alignment with target age group capabilities."


def get_regional_feedback(score):
    """Get feedback for regional relevance score."""
    if score >= 4:
        return "Strong regional relevance with appropriate local examples."
    elif score >= 3:
        return "Good regional context with potential for more local specificity."
    else:
        return "Needs more region-specific examples and cultural references."


def get_practical_feedback(score):
    """Get feedback for practical application score."""
    if score >= 4:
        return "Excellent connection to real-world applications."
    elif score >= 3:
        return "Good practical relevance with room for more examples."
    else:
        return "Needs stronger connection to practical applications."


def get_engagement_feedback(score):
    """Get feedback for engagement score."""
    if score >= 4:
        return "Highly engaging content that should maintain student interest."
    elif score >= 3:
        return "Generally engaging with potential for more interactive elements."
    else:
        return "Needs more engaging elements to capture student attention."


def get_overall_assessment(total_score, max_score):
    """Get overall assessment based on total score."""
    percentage = (total_score / max_score) * 100
    
    if percentage >= 90:
        return "Excellent - Content meets high standards for cultural relevance and educational value."
    elif percentage >= 80:
        return "Very Good - Content is well-developed with minor areas for improvement."
    elif percentage >= 70:
        return "Good - Content is acceptable but would benefit from some enhancements."
    elif percentage >= 60:
        return "Fair - Content needs several improvements to meet quality standards."
    else:
        return "Needs Improvement - Content requires significant revision before use."


def get_improvement_recommendations(validation_results):
    """Get specific recommendations for improvement."""
    recommendations = []
    
    for criterion, result in validation_results.items():
        if result['score'] < 4:
            recommendations.append(f"Improve {criterion}: {result['feedback']}")
    
    if not recommendations:
        recommendations.append("Content quality is excellent. No major improvements needed.")
    
    return recommendations
