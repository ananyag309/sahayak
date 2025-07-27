import os


def get_cultural_guidelines():
    """Fetch cultural guidelines from the JSON file."""
    # Get the directory where the current script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Construct the full path to the cultural guidelines file
    guidelines_file_path = os.path.join(script_dir, "../../cultural_guidelines.json")

    with open(guidelines_file_path, "r") as file:
        guidelines_text = file.read()
    guidelines_data = {"cultural_guidelines": guidelines_text}
    return guidelines_data
