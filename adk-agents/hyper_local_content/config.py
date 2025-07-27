import os

# Content quality thresholds
CONTENT_QUALITY_THRESHOLD = int(os.getenv("CONTENT_QUALITY_THRESHOLD", 40))
MAX_CONTENT_ITERATIONS = int(os.getenv("MAX_CONTENT_ITERATIONS", 2))

# Models
GENAI_MODEL = os.getenv("GENAI_MODEL", "gemini-2.0-flash")

# Supported languages (can be expanded)
SUPPORTED_LANGUAGES = [
    "hindi", "marathi", "gujarati", "tamil", "telugu", "kannada", 
    "malayalam", "bengali", "punjabi", "oriya", "assamese", "english"
]

# Content types
CONTENT_TYPES = [
    "story", "explanation", "dialogue", "poem", "lesson", "example"
]
