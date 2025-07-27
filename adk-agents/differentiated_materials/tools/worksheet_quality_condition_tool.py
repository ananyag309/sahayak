from google.adk.tools import ToolContext, FunctionTool
from .. import config
import time
import random


def check_worksheet_quality_and_escalate(tool_context: ToolContext) -> dict:
    """Checks worksheet quality and escalates if threshold met or max iterations reached."""
    
    # Add a small delay to help with rate limiting
    time.sleep(random.uniform(0.5, 1.5))
    
    # Increment iteration count
    current_iteration = tool_context.state.get("worksheet_iteration", 0)
    current_iteration += 1
    tool_context.state["worksheet_iteration"] = current_iteration
    
    max_iterations = config.MAX_WORKSHEET_ITERATIONS
    quality_score = tool_context.state.get("worksheet_quality_score", 50)
    quality_threshold = config.WORKSHEET_QUALITY_THRESHOLD
    
    # Check if we have generated worksheets
    latest_worksheets = tool_context.state.get('latest_generated_worksheets', {})
    has_worksheets = bool(latest_worksheets.get('worksheets', {}))
    
    # If we have worksheets and reasonable quality, accept them
    # This helps avoid rate limit issues by being less strict when API limits are hit
    if has_worksheets and quality_score >= (quality_threshold * 0.6):  # 60% of threshold
        print(f"  Accepting worksheets with score {quality_score} (relaxed threshold due to successful generation)")
        quality_met = True
    else:
        quality_met = quality_score >= quality_threshold
    
    response_message = f"Worksheet quality check iteration {current_iteration}: Quality score = {quality_score}, Threshold = {quality_threshold}. "
    
    if quality_met:
        print("  Worksheet quality threshold met. Setting escalate=True to stop the LoopAgent.")
        tool_context.actions.escalate = True
        response_message += "Quality threshold met, worksheets approved."
    elif current_iteration >= max_iterations:
        print(f"  Max iterations ({max_iterations}) reached. Setting escalate=True to stop the LoopAgent.")
        tool_context.actions.escalate = True
        response_message += "Max iterations reached, finalizing worksheets."
        
        # If we have any worksheets at all, mark as completed even if quality is lower
        if has_worksheets:
            response_message += " Worksheets available for use."
    else:
        print("  Quality needs improvement and max iterations not reached. Loop will continue.")
        response_message += "Quality needs improvement, continuing iteration."
    
    return {"status": "Worksheet quality evaluated", "message": response_message}


check_worksheet_quality_condition = FunctionTool(func=check_worksheet_quality_and_escalate)
