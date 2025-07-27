from ... import config
from google.adk.agents import Agent
from .prompt import LANGUAGE_DETECTION_PROMPT
from ..tools.fetch_cultural_guidelines_tool import get_cultural_guidelines
from .tools.language_detection_tool import detect_language_and_context


language_detection_agent = Agent(
    name="language_detection_agent",
    model=config.GENAI_MODEL,
    description="Detects the language and cultural context of the input request",
    instruction=LANGUAGE_DETECTION_PROMPT,
    tools=[detect_language_and_context, get_cultural_guidelines],
    output_key="language_context",
)
