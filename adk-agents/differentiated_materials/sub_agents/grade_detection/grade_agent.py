from ... import config
from google.adk.agents import Agent
from .prompt import GRADE_DETECTION_PROMPT
from .tools.grade_identification_tool import identify_grade_levels


grade_detection_agent = Agent(
    name="grade_detection_agent",
    model=config.GENAI_MODEL,
    description="Identifies appropriate grade levels for worksheet differentiation",
    instruction=GRADE_DETECTION_PROMPT,
    tools=[identify_grade_levels],
    output_key="grade_analysis",
)
