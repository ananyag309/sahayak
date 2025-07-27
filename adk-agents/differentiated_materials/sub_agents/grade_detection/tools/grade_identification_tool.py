from google.adk.tools import ToolContext
import json


def identify_grade_levels(tool_context: ToolContext) -> dict:
    """Identify appropriate grade levels for worksheet differentiation based on content analysis."""
    
    try:
        image_analysis = tool_context.state.get('image_content_analysis', {})
        grade_guidelines = tool_context.state.get('grade_guidelines', {})
        
        if not image_analysis:
            return {
                'status': 'error',
                'message': 'No image analysis found. Please process image first.'
            }
        
        # Extract key information from image analysis
        estimated_grade = image_analysis.get('estimated_grade_level', 7)
        subject = image_analysis.get('subject_detected', 'general')
        complexity = image_analysis.get('text_complexity', 'medium')
        concepts = image_analysis.get('concepts_identified', [])
        vocabulary = image_analysis.get('key_vocabulary', [])
        
        # Determine grade range for differentiation
        target_grades = calculate_grade_range(estimated_grade, complexity)
        
        # Classify educational level
        educational_levels = classify_educational_levels(target_grades)
        
        # Create grade level analysis
        grade_analysis = {
            'source_grade_level': estimated_grade,
            'detected_subject': subject,
            'content_complexity': complexity,
            'target_grades': target_grades,
            'educational_levels': educational_levels,
            'differentiation_strategy': create_differentiation_strategy(target_grades, subject, complexity),
            'key_concepts': concepts,
            'vocabulary_level': assess_vocabulary_level(vocabulary),
            'recommended_adaptations': get_adaptation_recommendations(subject, target_grades)
        }
        
        # Store analysis in session state
        tool_context.state['grade_analysis'] = grade_analysis
        
        return {
            'status': 'success',
            'message': f'Identified grade levels: {target_grades} for {subject} content',
            'analysis': grade_analysis
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Error identifying grade levels: {str(e)}'
        }


def calculate_grade_range(estimated_grade, complexity):
    """Calculate appropriate grade range for differentiation."""
    
    # Base range calculation
    if complexity == 'low':
        grade_range = [estimated_grade - 1, estimated_grade, estimated_grade + 1]
    elif complexity == 'high':
        grade_range = [estimated_grade - 2, estimated_grade, estimated_grade + 2]
    else:  # medium
        grade_range = [estimated_grade - 1, estimated_grade, estimated_grade + 1]
    
    # Ensure grades are within valid range (1-12)
    valid_grades = [g for g in grade_range if 1 <= g <= 12]
    
    # Ensure we have at least 3 grades, adjust if needed
    if len(valid_grades) < 3:
        if estimated_grade <= 3:
            valid_grades = [1, 3, 5]
        elif estimated_grade >= 10:
            valid_grades = [8, 10, 12]
        else:
            valid_grades = [estimated_grade - 1, estimated_grade, estimated_grade + 1]
    
    return sorted(list(set(valid_grades)))


def classify_educational_levels(grades):
    """Classify grades into educational levels."""
    
    levels = []
    for grade in grades:
        if grade <= 5:
            levels.append('elementary')
        elif grade <= 8:
            levels.append('middle')
        else:
            levels.append('high')
    
    return list(set(levels))


def create_differentiation_strategy(target_grades, subject, complexity):
    """Create differentiation strategy based on target grades and subject."""
    
    strategies = {
        'grade_adaptations': {},
        'question_type_progression': [],
        'complexity_scaling': {},
        'vocabulary_adjustments': {}
    }
    
    for grade in target_grades:
        if grade <= 5:
            strategies['grade_adaptations'][grade] = {
                'focus': 'concrete concepts, visual aids, simple language',
                'question_types': ['fill_blanks', 'matching', 'simple_mcq'],
                'instruction_style': 'step-by-step with examples'
            }
        elif grade <= 8:
            strategies['grade_adaptations'][grade] = {
                'focus': 'connecting concepts, guided reasoning, moderate complexity',
                'question_types': ['mcq', 'short_answer', 'problem_solving'],
                'instruction_style': 'guided discovery with explanations'
            }
        else:
            strategies['grade_adaptations'][grade] = {
                'focus': 'critical thinking, analysis, independent reasoning',
                'question_types': ['essay', 'analysis', 'synthesis'],
                'instruction_style': 'independent exploration with minimal guidance'
            }
    
    return strategies


def assess_vocabulary_level(vocabulary):
    """Assess vocabulary complexity level."""
    
    if not vocabulary:
        return 'basic'
    
    # Simple heuristic based on vocabulary complexity
    complex_indicators = ['synthesis', 'analysis', 'hypothesis', 'correlation', 'synthesis']
    academic_indicators = ['process', 'concept', 'function', 'structure', 'system']
    
    complex_count = sum(1 for word in vocabulary if any(indicator in word.lower() for indicator in complex_indicators))
    academic_count = sum(1 for word in vocabulary if any(indicator in word.lower() for indicator in academic_indicators))
    
    if complex_count > 2:
        return 'advanced'
    elif academic_count > 2:
        return 'academic'
    else:
        return 'basic'


def get_adaptation_recommendations(subject, target_grades):
    """Get subject-specific adaptation recommendations."""
    
    adaptations = {
        'mathematics': {
            'elementary': 'Use manipulatives, visual models, step-by-step examples',
            'middle': 'Connect to real-world problems, use multiple representations',
            'high': 'Focus on abstract reasoning, proof development, complex applications'
        },
        'science': {
            'elementary': 'Hands-on observations, simple experiments, basic vocabulary',
            'middle': 'Hypothesis testing, data analysis, scientific method',
            'high': 'Complex investigations, scientific reasoning, research analysis'
        },
        'english': {
            'elementary': 'Picture support, simple sentences, basic comprehension',
            'middle': 'Text analysis, writing development, vocabulary expansion',
            'high': 'Literary criticism, advanced composition, rhetorical analysis'
        },
        'social_studies': {
            'elementary': 'Timeline activities, map skills, community connections',
            'middle': 'Historical thinking, geographic analysis, civic engagement',
            'high': 'Historical synthesis, political analysis, economic reasoning'
        }
    }
    
    subject_adaptations = adaptations.get(subject, adaptations['science'])  # Default to science
    
    recommendations = {}
    for grade in target_grades:
        if grade <= 5:
            recommendations[f'grade_{grade}'] = subject_adaptations['elementary']
        elif grade <= 8:
            recommendations[f'grade_{grade}'] = subject_adaptations['middle']
        else:
            recommendations[f'grade_{grade}'] = subject_adaptations['high']
    
    return recommendations
