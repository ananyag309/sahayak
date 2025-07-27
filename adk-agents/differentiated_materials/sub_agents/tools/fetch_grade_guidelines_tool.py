import os
import json


def get_grade_guidelines():
    """Fetch grade guidelines from the JSON file."""
    # Get the directory where the current script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Construct the full path to the grade guidelines file
    guidelines_file_path = os.path.join(script_dir, "../../grade_guidelines.json")

    with open(guidelines_file_path, "r") as file:
        guidelines_text = file.read()
    
    guidelines_data = {"grade_guidelines": guidelines_text}
    return guidelines_data
