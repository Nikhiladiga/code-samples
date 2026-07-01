import typesense
from app.core.env import get_env

# Typesense Connection Details
TYPESENSE_HOST = get_env("TYPESENSE_HOST", "localhost")
TYPESENSE_PORT = get_env("TYPESENSE_PORT", "8108")
TYPESENSE_API_KEY = get_env("TYPESENSE_API_KEY", get_env("PUBLIC_TYPESENSE_API_KEY", "xyz"))

# Initialize Typesense Client
client = typesense.Client({
    'nodes': [{
        'host': TYPESENSE_HOST,
        'port': TYPESENSE_PORT,
        'protocol': 'http'
    }],
    'api_key': TYPESENSE_API_KEY,
    'connection_timeout_seconds': 120
})
