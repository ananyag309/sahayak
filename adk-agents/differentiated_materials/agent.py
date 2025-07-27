import datetime, uuid
from zoneinfo import ZoneInfo
from .sub_agents.image_processing.image_agent import image_processing_agent
from .sub_agents.grade_detection.grade_agent import grade_detection_agent
from .sub_agents.worksheet_planning.planning_agent import worksheet_planning_agent
from .sub_agents.worksheet_generation.generation_agent import worksheet_generation_agent
from .sub_agents.validation.validation_agent import worksheet_validation_agent
from .checker_agent import worksheet_quality_checker_agent
from google.adk.agents import SequentialAgent, LoopAgent
from google.adk.agents.callback_context import CallbackContext


def set_worksheet_session(callback_context: CallbackContext):
    """
    Sets a unique ID and timestamp for worksheet generation session.
    This function is called before the main differentiated_materials agent executes.
    """
    callback_context.state["worksheet_session_id"] = str(uuid.uuid4())
    callback_context.state["worksheet_timestamp"] = datetime.datetime.now(
        ZoneInfo("UTC")
    ).isoformat()


# This agent is responsible for generating differentiated educational worksheets.
# It uses a sequential process to:
# 1. Process and analyze uploaded textbook page images
# 2. Detect appropriate grade levels for differentiation
# 3. Plan differentiated worksheet structures
# 4. Generate actual worksheet content for multiple grade levels
# 5. Validate worksheet quality and educational effectiveness
# The process continues until either:
# - The worksheet quality score meets the threshold
# - The maximum number of iterations is reached

differentiated_worksheet_generation_agent = SequentialAgent(
    name="differentiated_worksheet_generation_agent",
    description=(
        """
        Analyzes textbook images and generates differentiated educational worksheets.
        1. Invoke the image_processing_agent to extract and analyze textbook content
        2. Invoke the grade_detection_agent to identify appropriate grade levels
        3. Invoke the worksheet_planning_agent to plan differentiated materials
        4. Invoke the worksheet_generation_agent to create actual worksheets
        5. Invoke the worksheet_validation_agent to validate quality and appropriateness
        """
    ),
    sub_agents=[
        image_processing_agent,
        grade_detection_agent,
        worksheet_planning_agent,
        worksheet_generation_agent,
        worksheet_validation_agent
    ],
)


# --- Main Loop Agent ---
# The LoopAgent will repeatedly execute its sub_agents in the order they are listed.
# It will continue looping until one of its sub_agents (specifically, the checker_agent's tool)
# sets tool_context.actions.escalate = True.
differentiated_materials = LoopAgent(
    name="differentiated_materials",
    description="Repeatedly runs worksheet generation process and checks quality until threshold is met.",
    sub_agents=[
        differentiated_worksheet_generation_agent,  # First, run the sequential worksheet generation process
        worksheet_quality_checker_agent,  # Second, check the quality and potentially stop the loop
    ],
    before_agent_callback=set_worksheet_session,
)

# Export root agent (following same pattern as other agents)
root_agent = differentiated_materials
