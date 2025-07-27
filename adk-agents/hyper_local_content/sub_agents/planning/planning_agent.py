from ... import config
from google.adk.agents import Agent
from .prompt import CONTENT_PLANNING_PROMPT
from .tools.content_planning_tool import plan_content_structure


content_planning_agent = Agent(
    name="content_planning_agent",
    model=config.GENAI_MODEL,
    description="Plans the structure and approach for culturally relevant content",
    instruction=CONTENT_PLANNING_PROMPT,
    tools=[plan_content_structure],
    output_key="content_plan",
)
