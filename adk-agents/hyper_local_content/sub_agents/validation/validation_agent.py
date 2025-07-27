from ... import config
from google.adk.agents import Agent
from .prompt import CULTURAL_VALIDATION_PROMPT
from .tools.cultural_validation_tool import validate_cultural_appropriateness
from .tools.set_content_score_tool import set_content_quality_score


cultural_validation_agent = Agent(
    name="cultural_validation_agent",
    model=config.GENAI_MODEL,
    description="Validates cultural appropriateness and educational quality",
    instruction=CULTURAL_VALIDATION_PROMPT,
    tools=[validate_cultural_appropriateness, set_content_quality_score],
    output_key="validation_result",
)
