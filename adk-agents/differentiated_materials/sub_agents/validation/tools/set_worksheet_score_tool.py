from google.adk.tools import ToolContext


def set_worksheet_quality_score(tool_context: ToolContext, quality_score: int) -> dict:
    """Set the worksheet quality score in the session state."""
    print(f"Worksheet quality score is {quality_score}")
    tool_context.state["worksheet_quality_score"] = quality_score
    
    return {
        'status': 'success',
        'message': f'Worksheet quality score set to {quality_score}',
        'score': quality_score
    }
