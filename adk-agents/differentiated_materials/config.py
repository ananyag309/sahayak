import os

# Worksheet quality thresholds
WORKSHEET_QUALITY_THRESHOLD = int(os.getenv("WORKSHEET_QUALITY_THRESHOLD", 40))
MAX_WORKSHEET_ITERATIONS = int(os.getenv("MAX_WORKSHEET_ITERATIONS", 2))

# Models
GENAI_MODEL = os.getenv("GENAI_MODEL", "gemini-2.0-flash")

# Supported grade levels
SUPPORTED_GRADE_LEVELS = list(range(1, 13))  # Grades 1-12

# Image processing settings
IMAGE_STORAGE_BUCKET = os.getenv("IMAGE_STORAGE_BUCKET", os.getenv("GCS_BUCKET_NAME", "sahayak-images-bucket"))
MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", 10))

# Worksheet generation settings
DEFAULT_QUESTION_COUNT = {
    "elementary": 8,   # Grades 1-5
    "middle": 10,      # Grades 6-8  
    "high": 12         # Grades 9-12
}

# Subject categories
SUPPORTED_SUBJECTS = [
    "mathematics", "science", "english", "social_studies", 
    "physics", "chemistry", "biology", "history", "geography"
]
