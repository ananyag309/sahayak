import os
from google.adk.agents import Agent
from .prompt import WORKSHEET_GENERATION_PROMPT
from .tools.worksheet_generation_tool import generate_differentiated_worksheets

# Import config safely
try:
    from ... import config
    GENAI_MODEL = config.GENAI_MODEL
except ImportError:
    GENAI_MODEL = os.getenv("GENAI_MODEL", "gemini-2.0-flash")


worksheet_generation_agent = Agent(
    name="worksheet_generation_agent",
    model=GENAI_MODEL,
    description="Generates actual differentiated worksheet content for multiple grade levels",
    instruction=WORKSHEET_GENERATION_PROMPT,
    tools=[generate_differentiated_worksheets],
    output_key="generated_worksheets",
)
