from google.adk.agents import Agent
from . import config
from .prompt import WORKSHEET_QUALITY_CHECKER_PROMPT
from .tools.worksheet_quality_condition_tool import check_worksheet_quality_condition


worksheet_quality_checker_agent = Agent(
    name="worksheet_quality_checker_agent",
    model=config.GENAI_MODEL,
    instruction=WORKSHEET_QUALITY_CHECKER_PROMPT,
    tools=[check_worksheet_quality_condition],
    output_key="quality_check_output",
)
