from google.adk.tools import ToolContext, FunctionTool
from .. import config


def check_content_quality_and_escalate(tool_context: ToolContext) -> dict:
    """Checks content quality and escalates if threshold met or max iterations reached."""
    
    # Increment iteration count
    current_iteration = tool_context.state.get("content_iteration", 0)
    current_iteration += 1
    tool_context.state["content_iteration"] = current_iteration
    
    max_iterations = config.MAX_CONTENT_ITERATIONS
    quality_score = tool_context.state.get("content_quality_score", 50)
    quality_threshold = config.CONTENT_QUALITY_THRESHOLD
    
    quality_met = quality_score >= quality_threshold
    
    response_message = f"Quality check iteration {current_iteration}: Quality score = {quality_score}, Threshold = {quality_threshold}. "
    
    if quality_met:
        print("  Content quality threshold met. Setting escalate=True to stop the LoopAgent.")
        tool_context.actions.escalate = True
        response_message += "Quality threshold met, content approved."
    elif current_iteration >= max_iterations:
        print(f"  Max iterations ({max_iterations}) reached. Setting escalate=True to stop the LoopAgent.")
        tool_context.actions.escalate = True
        response_message += "Max iterations reached, finalizing content."
    else:
        print("  Quality needs improvement and max iterations not reached. Loop will continue.")
        response_message += "Quality needs improvement, continuing iteration."
    
    return {"status": "Quality evaluated", "message": response_message}


check_content_quality_condition = FunctionTool(func=check_content_quality_and_escalate)
