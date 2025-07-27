from ... import config
from google.adk.agents import Agent
from .prompt import WORKSHEET_PLANNING_PROMPT
from .tools.worksheet_planning_tool import plan_differentiated_worksheets


worksheet_planning_agent = Agent(
    name="worksheet_planning_agent",
    model=config.GENAI_MODEL,
    description="Plans differentiated worksheet structures for multiple grade levels",
    instruction=WORKSHEET_PLANNING_PROMPT,
    tools=[plan_differentiated_worksheets],
    output_key="worksheet_plans",
)
