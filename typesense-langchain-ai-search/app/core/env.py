import os
from dotenv import load_dotenv

# Locate and load the .env file once globally
dotenv_path = os.path.join(os.getcwd(), ".env")
if not os.path.exists(dotenv_path):
    # Go up 3 levels from app/core/env.py to reach root
    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
load_dotenv(dotenv_path=dotenv_path, override=True)

def get_env(key: str, default: any = None) -> any:
    """Retrieves the value of an environment variable, returning a default if not found."""
    return os.getenv(key, default)
