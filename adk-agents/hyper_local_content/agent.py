import datetime, uuid
from zoneinfo import ZoneInfo
from .sub_agents.language.language_agent import language_detection_agent
from .sub_agents.planning.planning_agent import content_planning_agent
from .sub_agents.generation.generation_agent import content_generation_agent
from .sub_agents.validation.validation_agent import cultural_validation_agent
from .checker_agent import content_quality_checker_agent
from google.adk.agents import SequentialAgent, LoopAgent
from google.adk.agents.callback_context import CallbackContext


def set_content_session(callback_context: CallbackContext):
    """
    Sets a unique ID and timestamp for content generation session.
    This function is called before the main hyper_local_content agent executes.
    """
    callback_context.state["content_session_id"] = str(uuid.uuid4())
    callback_context.state["content_timestamp"] = datetime.datetime.now(
        ZoneInfo("UTC")
    ).isoformat()


# This agent is responsible for generating culturally relevant educational content.
# It uses a sequential process to:
# 1. Detect language and cultural context from the input request
# 2. Plan appropriate content structure and approach
# 3. Generate the actual educational content
# 4. Validate cultural appropriateness and educational quality
# The process continues until either:
# - The content quality score meets the threshold
# - The maximum number of iterations is reached

hyper_local_content_generation_agent = SequentialAgent(
    name="hyper_local_content_generation_agent",
    description=(
        """
        Analyzes input request and generates culturally relevant educational content.
        1. Invoke the language_detection_agent to identify language and cultural context
        2. Invoke the content_planning_agent to plan appropriate content structure
        3. Invoke the content_generation_agent to generate the actual content
        4. Invoke the cultural_validation_agent to validate cultural appropriateness and quality
        """
    ),
    sub_agents=[
        language_detection_agent, 
        content_planning_agent, 
        content_generation_agent, 
        cultural_validation_agent
    ],
)


# --- Main Loop Agent ---
# The LoopAgent will repeatedly execute its sub_agents in the order they are listed.
# It will continue looping until one of its sub_agents (specifically, the checker_agent's tool)
# sets tool_context.actions.escalate = True.
hyper_local_content = LoopAgent(
    name="hyper_local_content",
    description="Repeatedly runs content generation process and checks quality until threshold is met.",
    sub_agents=[
        hyper_local_content_generation_agent,  # First, run the sequential content generation process
        content_quality_checker_agent,  # Second, check the quality and potentially stop the loop
    ],
    before_agent_callback=set_content_session,
)

# Export root agent (following same pattern as image_scoring)
root_agent = hyper_local_content
