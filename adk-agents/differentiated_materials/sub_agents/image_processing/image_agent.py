from ... import config
from google.adk.agents import Agent
from .prompt import IMAGE_PROCESSING_PROMPT
from ..tools.fetch_grade_guidelines_tool import get_grade_guidelines
from .tools.image_text_extraction_tool import extract_image_content


image_processing_agent = Agent(
    name="image_processing_agent",
    model=config.GENAI_MODEL,
    description="Analyzes textbook page images and extracts educational content",
    instruction=IMAGE_PROCESSING_PROMPT,
    tools=[extract_image_content, get_grade_guidelines],
    output_key="image_analysis",
)
