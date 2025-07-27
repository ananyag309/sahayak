from google.adk.tools import ToolContext
import json


def plan_differentiated_worksheets(tool_context: ToolContext) -> dict:
    """Plan differentiated worksheets based on grade analysis and content."""
    
    try:
        image_analysis = tool_context.state.get('image_content_analysis', {})
        grade_analysis = tool_context.state.get('grade_analysis', {})
        grade_guidelines = tool_context.state.get('grade_guidelines', {})
        
        if not image_analysis or not grade_analysis:
            return {
                'status': 'error',
                'message': 'Missing required analysis data. Please complete image processing and grade detection first.'
            }
        
        # Extract key information
        target_grades = grade_analysis.get('target_grades', [5, 7, 9])
        subject = grade_analysis.get('detected_subject', 'science')
        concepts = image_analysis.get('concepts_identified', [])
        learning_objectives = image_analysis.get('learning_objectives', [])
        content_structure = image_analysis.get('content_structure', {})
        
        # Create comprehensive worksheet plans
        worksheet_plans = {}
        
        for grade in target_grades:
            plan = create_grade_specific_plan(
                grade, subject, concepts, learning_objectives, content_structure, grade_guidelines
            )
            worksheet_plans[f'grade_{grade}'] = plan
        
        # Create overall planning summary
        planning_summary = {
            'total_worksheets': len(target_grades),
            'target_grades': target_grades,
            'subject_area': subject,
            'differentiation_approach': determine_differentiation_approach(target_grades),
            'content_focus': concepts[:5],  # Top 5 concepts
            'worksheet_plans': worksheet_plans,
            'quality_criteria': define_quality_criteria(target_grades, subject),
            'estimated_completion_time': estimate_completion_times(target_grades)
        }
        
        # Store planning results
        tool_context.state['worksheet_plans'] = planning_summary
        
        return {
            'status': 'success',
            'message': f'Created differentiated worksheet plans for grades {target_grades}',
            'planning_summary': planning_summary
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Error planning worksheets: {str(e)}'
        }


def create_grade_specific_plan(grade, subject, concepts, learning_objectives, content_structure, guidelines):
    """Create detailed plan for a specific grade level."""
    
    # Determine educational level
    if grade <= 5:
        level = 'elementary'
    elif grade <= 8:
        level = 'middle'
    else:
        level = 'high'
    
    # Get grade-specific characteristics
    level_info = get_level_characteristics(level)
    
    # Create the plan
    plan = {
        'grade_level': grade,
        'educational_level': level,
        'learning_objectives': adapt_learning_objectives(learning_objectives, grade, level),
        'question_distribution': get_question_distribution(level, subject),
        'content_adaptations': get_content_adaptations(concepts, grade, level, subject),
        'vocabulary_adaptations': get_vocabulary_adaptations(grade, level),
        'visual_elements': get_visual_requirements(grade, level),
        'instruction_style': level_info['instruction_style'],
        'cognitive_level': level_info['cognitive_level'],
        'estimated_questions': get_question_count(level),
        'assessment_criteria': get_assessment_criteria(grade, level, subject),
        'differentiation_features': get_differentiation_features(grade, level, subject)
    }
    
    return plan


def get_level_characteristics(level):
    """Get characteristics for educational level."""
    
    characteristics = {
        'elementary': {
            'instruction_style': 'Clear, simple instructions with visual examples',
            'cognitive_level': 'Remember, understand, apply basic concepts',
            'complexity': 'low',
            'support_level': 'high'
        },
        'middle': {
            'instruction_style': 'Detailed instructions with guided steps',
            'cognitive_level': 'Understand, apply, analyze relationships',
            'complexity': 'medium',
            'support_level': 'medium'
        },
        'high': {
            'instruction_style': 'Independent work with minimal guidance',
            'cognitive_level': 'Analyze, evaluate, create, synthesize',
            'complexity': 'high',
            'support_level': 'low'
        }
    }
    
    return characteristics.get(level, characteristics['middle'])


def adapt_learning_objectives(original_objectives, grade, level):
    """Adapt learning objectives for specific grade level."""
    
    if not original_objectives:
        return [f"Students will understand key concepts appropriate for grade {grade}"]
    
    adapted_objectives = []
    
    for objective in original_objectives:
        if level == 'elementary':
            # Simplify language and focus on basic understanding
            adapted = objective.replace('analyze', 'identify').replace('evaluate', 'recognize')
            adapted = f"Students will {adapted.lower()}"
        elif level == 'middle':
            # Moderate complexity with guided reasoning
            adapted = objective.replace('synthesize', 'compare').replace('create', 'explain')
            adapted = f"Students will {adapted.lower()}"
        else:  # high
            # Advanced thinking and independence
            adapted = objective
            if not adapted.startswith('Students will'):
                adapted = f"Students will {adapted.lower()}"
        
        adapted_objectives.append(adapted)
    
    return adapted_objectives


def get_question_distribution(level, subject):
    """Get recommended question type distribution for level and subject."""
    
    distributions = {
        'elementary': {
            'fill_blanks': 0.3,
            'multiple_choice': 0.3,
            'matching': 0.2,
            'true_false': 0.1,
            'drawing': 0.1
        },
        'middle': {
            'multiple_choice': 0.3,
            'short_answer': 0.3,
            'problem_solving': 0.2,
            'explanation': 0.1,
            'comparison': 0.1
        },
        'high': {
            'short_answer': 0.2,
            'essay': 0.3,
            'analysis': 0.2,
            'synthesis': 0.1,
            'evaluation': 0.1,
            'research': 0.1
        }
    }
    
    return distributions.get(level, distributions['middle'])


def get_content_adaptations(concepts, grade, level, subject):
    """Get content adaptation strategies for grade level."""
    
    adaptations = {
        'vocabulary_level': get_vocabulary_level(level),
        'concept_depth': get_concept_depth(level),
        'examples_type': get_examples_type(level),
        'support_materials': get_support_materials(level, subject),
        'concept_connections': get_concept_connections(level)
    }
    
    return adaptations


def get_vocabulary_level(level):
    """Get appropriate vocabulary level."""
    
    levels = {
        'elementary': 'Basic everyday vocabulary with picture support',
        'middle': 'Academic vocabulary with clear definitions',
        'high': 'Advanced academic and technical terminology'
    }
    
    return levels.get(level, levels['middle'])


def get_concept_depth(level):
    """Get appropriate concept depth."""
    
    depths = {
        'elementary': 'Surface level understanding with concrete examples',
        'middle': 'Moderate depth with connections between concepts',
        'high': 'Deep understanding with abstract reasoning'
    }
    
    return depths.get(level, depths['middle'])


def get_examples_type(level):
    """Get appropriate example types."""
    
    examples = {
        'elementary': 'Concrete, familiar examples from daily life',
        'middle': 'Mix of familiar and academic examples',
        'high': 'Complex, theoretical examples requiring analysis'
    }
    
    return examples.get(level, examples['middle'])


def get_support_materials(level, subject):
    """Get recommended support materials."""
    
    support = {
        'elementary': ['visual aids', 'diagrams', 'word banks', 'example templates'],
        'middle': ['reference charts', 'guided notes', 'process flowcharts'],
        'high': ['research resources', 'analysis frameworks', 'evaluation rubrics']
    }
    
    return support.get(level, support['middle'])


def get_concept_connections(level):
    """Get concept connection strategies."""
    
    connections = {
        'elementary': 'Simple cause-and-effect relationships',
        'middle': 'Multiple concept relationships with guidance',
        'high': 'Complex interconnections requiring synthesis'
    }
    
    return connections.get(level, connections['middle'])


def get_vocabulary_adaptations(grade, level):
    """Get vocabulary adaptation strategies."""
    
    adaptations = {
        'word_choice': get_vocabulary_level(level),
        'definition_support': get_definition_support(level),
        'context_clues': get_context_strategies(level),
        'visual_support': get_visual_vocabulary_support(level)
    }
    
    return adaptations


def get_definition_support(level):
    """Get definition support level."""
    
    support = {
        'elementary': 'All key terms defined with pictures',
        'middle': 'Important terms defined in context',
        'high': 'Students expected to understand academic vocabulary'
    }
    
    return support.get(level, support['middle'])


def get_context_strategies(level):
    """Get context clue strategies."""
    
    strategies = {
        'elementary': 'Explicit context clues provided',
        'middle': 'Some context clues with guided discovery',
        'high': 'Students infer meaning from context'
    }
    
    return strategies.get(level, strategies['middle'])


def get_visual_vocabulary_support(level):
    """Get visual vocabulary support."""
    
    support = {
        'elementary': 'Extensive visual vocabulary support',
        'middle': 'Moderate visual support for key terms',
        'high': 'Minimal visual support, text-based'
    }
    
    return support.get(level, support['middle'])


def get_visual_requirements(grade, level):
    """Get visual element requirements."""
    
    requirements = {
        'elementary': {
            'images': 'High - pictures for most concepts',
            'diagrams': 'Simple, labeled diagrams',
            'charts': 'Basic charts with clear labels',
            'layout': 'Spacious with clear sections'
        },
        'middle': {
            'images': 'Moderate - supporting images',
            'diagrams': 'Detailed diagrams with explanations',
            'charts': 'Structured charts and tables',
            'layout': 'Organized with clear headings'
        },
        'high': {
            'images': 'Minimal - only when necessary',
            'diagrams': 'Complex diagrams for analysis',
            'charts': 'Data tables and analytical charts',
            'layout': 'Dense, text-focused layout'
        }
    }
    
    return requirements.get(level, requirements['middle'])


def get_question_count(level):
    """Get recommended question count."""
    
    counts = {
        'elementary': 8,
        'middle': 10,
        'high': 12
    }
    
    return counts.get(level, 10)


def get_assessment_criteria(grade, level, subject):
    """Get assessment criteria for grade level."""
    
    criteria = {
        'accuracy': get_accuracy_expectations(level),
        'completeness': get_completeness_expectations(level),
        'reasoning': get_reasoning_expectations(level),
        'communication': get_communication_expectations(level),
        'subject_specific': get_subject_specific_criteria(subject, level)
    }
    
    return criteria


def get_accuracy_expectations(level):
    """Get accuracy expectations."""
    
    expectations = {
        'elementary': 'Basic factual accuracy with teacher support',
        'middle': 'Good accuracy with some independent verification',
        'high': 'High accuracy with independent fact-checking'
    }
    
    return expectations.get(level, expectations['middle'])


def get_completeness_expectations(level):
    """Get completeness expectations."""
    
    expectations = {
        'elementary': 'Complete basic requirements with guidance',
        'middle': 'Thorough completion of all parts',
        'high': 'Comprehensive responses with extensions'
    }
    
    return expectations.get(level, expectations['middle'])


def get_reasoning_expectations(level):
    """Get reasoning expectations."""
    
    expectations = {
        'elementary': 'Simple reasoning with concrete examples',
        'middle': 'Clear reasoning with some complexity',
        'high': 'Sophisticated reasoning and analysis'
    }
    
    return expectations.get(level, expectations['middle'])


def get_communication_expectations(level):
    """Get communication expectations."""
    
    expectations = {
        'elementary': 'Clear communication with basic vocabulary',
        'middle': 'Effective communication with academic language',
        'high': 'Sophisticated communication with advanced vocabulary'
    }
    
    return expectations.get(level, expectations['middle'])


def get_subject_specific_criteria(subject, level):
    """Get subject-specific assessment criteria."""
    
    criteria = {
        'mathematics': {
            'elementary': 'Correct calculations with work shown',
            'middle': 'Problem-solving strategies and explanations',
            'high': 'Mathematical reasoning and proof'
        },
        'science': {
            'elementary': 'Accurate observations and simple conclusions',
            'middle': 'Scientific method application and analysis',
            'high': 'Scientific reasoning and evaluation'
        },
        'english': {
            'elementary': 'Basic comprehension and clear writing',
            'middle': 'Literary analysis and organized writing',
            'high': 'Critical analysis and sophisticated writing'
        }
    }
    
    subject_criteria = criteria.get(subject, criteria['science'])
    return subject_criteria.get(level, 'Grade-appropriate understanding and communication')


def get_differentiation_features(grade, level, subject):
    """Get specific differentiation features for the grade level."""
    
    features = {
        'content_modifications': get_content_modifications(level),
        'process_modifications': get_process_modifications(level),
        'product_modifications': get_product_modifications(level),
        'learning_environment': get_environment_modifications(level)
    }
    
    return features


def get_content_modifications(level):
    """Get content modification strategies."""
    
    modifications = {
        'elementary': 'Simplified concepts, concrete examples, visual supports',
        'middle': 'Scaffold complex concepts, provide examples and non-examples',
        'high': 'Present complex concepts, encourage independent exploration'
    }
    
    return modifications.get(level, modifications['middle'])


def get_process_modifications(level):
    """Get process modification strategies."""
    
    modifications = {
        'elementary': 'Step-by-step guidance, frequent check-ins, peer support',
        'middle': 'Guided practice, structured collaboration, choice in approaches',
        'high': 'Independent work, self-directed learning, minimal scaffolding'
    }
    
    return modifications.get(level, modifications['middle'])


def get_product_modifications(level):
    """Get product modification strategies."""
    
    modifications = {
        'elementary': 'Multiple formats, visual presentations, oral options',
        'middle': 'Choice in presentation format, rubric-guided work',
        'high': 'Open-ended products, research-based presentations'
    }
    
    return modifications.get(level, modifications['middle'])


def get_environment_modifications(level):
    """Get learning environment modifications."""
    
    modifications = {
        'elementary': 'Supportive environment, clear structure, frequent encouragement',
        'middle': 'Balanced support and independence, collaborative opportunities',
        'high': 'Independent work environment, peer collaboration, self-regulation'
    }
    
    return modifications.get(level, modifications['middle'])


def determine_differentiation_approach(target_grades):
    """Determine overall differentiation approach."""
    
    grade_span = max(target_grades) - min(target_grades)
    
    if grade_span <= 2:
        return 'Fine-tuned differentiation within similar developmental levels'
    elif grade_span <= 4:
        return 'Moderate differentiation across developmental levels'
    else:
        return 'Significant differentiation across multiple developmental stages'


def define_quality_criteria(target_grades, subject):
    """Define quality criteria for worksheet evaluation."""
    
    criteria = {
        'content_accuracy': 'All factual information must be correct',
        'grade_appropriateness': 'Content complexity matches target grade level',
        'question_quality': 'Questions are clear, unambiguous, and well-constructed',
        'differentiation_effectiveness': 'Meaningful differences across grade levels',
        'educational_value': 'Clear learning objectives and assessment alignment',
        'engagement_factor': 'Content is interesting and relevant to students',
        'instructional_clarity': 'Instructions are clear and appropriate for grade level',
        'visual_design': 'Layout and visual elements support learning',
        'assessment_validity': 'Questions effectively measure intended learning',
        'cultural_sensitivity': 'Content is inclusive and culturally appropriate'
    }
    
    return criteria


def estimate_completion_times(target_grades):
    """Estimate completion times for each grade level."""
    
    times = {}
    for grade in target_grades:
        if grade <= 5:
            times[f'grade_{grade}'] = '20-30 minutes'
        elif grade <= 8:
            times[f'grade_{grade}'] = '30-40 minutes'
        else:
            times[f'grade_{grade}'] = '40-50 minutes'
    
    return times
