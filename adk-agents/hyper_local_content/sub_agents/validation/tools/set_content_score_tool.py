from google.adk.tools import ToolContext


def set_content_quality_score(tool_context: ToolContext, quality_score: int) -> str:
    """Set the content quality score in the session state."""
    print(f"Content quality score is {quality_score}")
    tool_context.state["content_quality_score"] = quality_score
    
    return {
        'status': 'success',
        'message': f'Content quality score set to {quality_score}',
        'score': quality_score
    }
