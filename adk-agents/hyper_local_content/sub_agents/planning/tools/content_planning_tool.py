from google.adk.tools import ToolContext
import json


def plan_content_structure(tool_context: ToolContext) -> dict:
    """Plans the structure and approach for culturally relevant educational content."""
    
    try:
        language_context = tool_context.state.get('language_context', {})
        cultural_guidelines = tool_context.state.get('cultural_guidelines', {})
        
        detected_language = language_context.get('detected_language', 'english')
        content_type = language_context.get('content_type', 'story')
        educational_topic = language_context.get('educational_topic', 'general')
        cultural_region = language_context.get('cultural_region', 'India')
        original_request = language_context.get('original_request', '')
        
        # Create content plan based on context
        content_plan = {
            'title': f"Educational {content_type.title()} about {educational_topic}",
            'content_type': content_type,
            'target_language': detected_language,
            'educational_topic': educational_topic,
            'cultural_region': cultural_region,
            'structure': {},
            'learning_objectives': [],
            'cultural_references': [],
            'engagement_strategies': [],
            'age_appropriateness': 'middle_school',
            'complexity_level': 'moderate'
        }
        
        # Define structure based on content type
        if content_type == 'story':
            content_plan['structure'] = {
                'introduction': 'Set the scene with local context',
                'characters': 'Include relatable local characters',
                'plot_development': 'Integrate educational concepts naturally',
                'climax': 'Highlight key learning moment',
                'resolution': 'Reinforce educational message',
                'moral_lesson': 'Connect to cultural values'
            }
            content_plan['learning_objectives'] = [
                f'Understand key concepts related to {educational_topic}',
                'Connect learning to real-world applications',
                'Appreciate cultural context and values'
            ]
            
        elif content_type == 'explanation':
            content_plan['structure'] = {
                'introduction': 'Start with familiar local example',
                'concept_introduction': 'Introduce main concept clearly',
                'detailed_explanation': 'Break down into digestible parts',
                'local_examples': 'Use region-specific examples',
                'practical_application': 'Show real-world relevance',
                'summary': 'Recap key points'
            }
            content_plan['learning_objectives'] = [
                f'Clearly understand {educational_topic} concepts',
                'Identify local examples and applications',
                'Apply knowledge to everyday situations'
            ]
            
        elif content_type == 'dialogue':
            content_plan['structure'] = {
                'character_setup': 'Introduce conversational participants',
                'question_introduction': 'Pose the educational question',
                'discussion_flow': 'Natural conversation exploring topic',
                'knowledge_sharing': 'Characters share insights',
                'conclusion': 'Summarize key learnings'
            }
            
        # Add cultural references based on region
        cultural_refs = {
            'Maharashtra': ['local festivals like Ganpati', 'traditional farming practices', 'local foods like bhakri'],
            'Gujarat': ['local traditions', 'agricultural practices', 'cultural celebrations'],
            'Tamil Nadu': ['local customs', 'traditional knowledge', 'regional practices'],
            'North India': ['local festivals', 'traditional practices', 'regional examples'],
            'India (General)': ['diverse cultural practices', 'common festivals', 'shared traditions']
        }
        
        content_plan['cultural_references'] = cultural_refs.get(cultural_region, cultural_refs['India (General)'])
        
        # Add engagement strategies
        content_plan['engagement_strategies'] = [
            'Use familiar local settings and characters',
            'Include interactive questions',
            'Connect to student experiences',
            'Use visual and descriptive language',
            'Include cultural elements naturally'
        ]
        
        # Store the plan in session state
        tool_context.state['content_plan'] = content_plan
        
        return {
            'status': 'success',
            'message': f'Content plan created for {content_type} in {detected_language} about {educational_topic}',
            'plan': content_plan
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Error planning content structure: {str(e)}'
        }
