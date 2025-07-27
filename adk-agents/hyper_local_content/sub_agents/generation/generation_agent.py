from ... import config
from google.adk.agents import Agent
from .prompt import CONTENT_GENERATION_PROMPT
from .tools.content_generation_tool import generate_educational_content


content_generation_agent = Agent(
    name="content_generation_agent",
    model=config.GENAI_MODEL,
    description="Generates the actual educational content based on the plan",
    instruction=CONTENT_GENERATION_PROMPT,
    tools=[generate_educational_content],
    output_key="generated_content",
)
