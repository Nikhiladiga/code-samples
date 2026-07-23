from .client import typesense_client

BOOKS_COLLECTION_NAME = 'books'

books_collection_schema = {
    'name': BOOKS_COLLECTION_NAME,
    'fields': [
        {'name': 'id', 'type': 'string'},
        {'name': 'title', 'type': 'string'},
        {'name': 'authors', 'type': 'string[]', 'facet': True},
        {'name': 'publication_year', 'type': 'int32', 'facet': True, 'optional': True},
        {'name': 'average_rating', 'type': 'float', 'facet': True, 'optional': True},
        {'name': 'image_url', 'type': 'string', 'optional': True},
        {'name': 'ratings_count', 'type': 'int32', 'optional': True},
    ]
}

def initialize_typesense():
    try:
        collections = typesense_client.collections.retrieve()
        collection_exists = any(c['name'] == BOOKS_COLLECTION_NAME for c in collections)

        if not collection_exists:
            print(f"Creating collection {BOOKS_COLLECTION_NAME}...")
            typesense_client.collections.create(books_collection_schema)
            print(f"Collection {BOOKS_COLLECTION_NAME} created successfully.")
        else:
            print(f"Collection {BOOKS_COLLECTION_NAME} already exists.")
    except Exception as e:
        print(f"Error initializing Typesense collection: {e}")
        # Not throwing the error to prevent app crash if Typesense is down
