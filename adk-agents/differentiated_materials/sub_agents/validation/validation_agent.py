from ... import config
from google.adk.agents import Agent
from .prompt import WORKSHEET_VALIDATION_PROMPT
from .tools.worksheet_validation_tool import validate_worksheet_quality
from .tools.set_worksheet_score_tool import set_worksheet_quality_score


worksheet_validation_agent = Agent(
    name="worksheet_validation_agent",
    model=config.GENAI_MODEL,
    description="Validates quality and appropriateness of differentiated worksheets",
    instruction=WORKSHEET_VALIDATION_PROMPT,
    tools=[validate_worksheet_quality, set_worksheet_quality_score],
    output_key="validation_result",
)
