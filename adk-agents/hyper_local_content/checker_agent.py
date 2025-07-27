from google.adk.agents import Agent
from . import config
from .prompt import CONTENT_QUALITY_CHECKER_PROMPT
from .tools.quality_condition_tool import check_content_quality_condition


content_quality_checker_agent = Agent(
    name="content_quality_checker_agent",
    model=config.GENAI_MODEL,
    instruction=CONTENT_QUALITY_CHECKER_PROMPT,
    tools=[check_content_quality_condition],
    output_key="quality_check_output",
)
