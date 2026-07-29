import logging
from .client import typesense_client

logger = logging.getLogger(__name__)

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
            logger.info('Creating collection %s...', BOOKS_COLLECTION_NAME)
            typesense_client.collections.create(books_collection_schema)
            logger.info('Collection %s created successfully.', BOOKS_COLLECTION_NAME)
        else:
            logger.info('Collection %s already exists.', BOOKS_COLLECTION_NAME)
    except Exception as e:
        logger.error('Error initializing Typesense collection: %s', e)
