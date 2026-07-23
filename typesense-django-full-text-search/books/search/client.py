import os
import typesense
from dotenv import load_dotenv

load_dotenv()

typesense_client = typesense.Client({
    'nodes': [{
        'host': os.environ.get('TYPESENSE_HOST', 'localhost'),
        'port': os.environ.get('TYPESENSE_PORT', '8108'),
        'protocol': os.environ.get('TYPESENSE_PROTOCOL', 'http')
    }],
    'api_key': os.environ.get('TYPESENSE_API_KEY', 'xyz'),
    'connection_timeout_seconds': 5
})
