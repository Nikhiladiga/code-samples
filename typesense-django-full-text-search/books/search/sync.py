import logging
import datetime
import threading
from django.utils import timezone
from .client import typesense_client
from .collections import BOOKS_COLLECTION_NAME

logger = logging.getLogger(__name__)

# Thread-safe sync state
_sync_lock = threading.Lock()
_last_sync_time = datetime.datetime(1970, 1, 1, tzinfo=datetime.timezone.utc)

BATCH_SIZE = 1000

def get_last_sync_time():
    with _sync_lock:
        return _last_sync_time

def _set_last_sync_time(value):
    global _last_sync_time
    with _sync_lock:
        _last_sync_time = value

def _map_book_to_document(book):
    return {
        'id': str(book.id),
        'title': book.title,
        'authors': book.authors if isinstance(book.authors, list) else [book.authors],
        'publication_year': book.publication_year or 0,
        'average_rating': float(book.average_rating) if book.average_rating else 0.0,
        'image_url': book.image_url or '',
        'ratings_count': book.ratings_count or 0,
    }

def run_full_sync():
    logger.info('Running full sync...')
    from books.models import Book

    last_id = 0
    total_processed = 0

    while True:
        try:
            books = list(Book.objects.filter(id__gt=last_id).order_by('id')[:BATCH_SIZE])
        except Exception as err:
            logger.error('Database error during full sync fetching: %s', err)
            break

        if not books:
            break

        last_id = books[-1].id
        documents = [_map_book_to_document(b) for b in books]

        try:
            typesense_client.collections[BOOKS_COLLECTION_NAME].documents.import_(documents, {'action': 'upsert'})
            total_processed += len(documents)
            logger.info('Full sync: Processed %d books.', total_processed)
        except Exception as err:
            logger.error('Error importing documents during full sync: %s', err)
            break

    _set_last_sync_time(timezone.now())
    logger.info('Full sync completed.')

def run_incremental_sync():
    sync_started_at = timezone.now()
    current_last_sync = get_last_sync_time()

    logger.info('Running incremental sync since %s...', current_last_sync.isoformat())
    from books.models import Book

    # 1. Upsert newly created or updated books — paginated
    last_id = 0
    total_upserted = 0

    while True:
        batch = list(
            Book.objects.filter(updated_at__gt=current_last_sync, id__gt=last_id)
            .order_by('id')[:BATCH_SIZE]
        )
        if not batch:
            break

        last_id = batch[-1].id
        documents = [_map_book_to_document(b) for b in batch]

        try:
            typesense_client.collections[BOOKS_COLLECTION_NAME].documents.import_(documents, {'action': 'upsert'})
            total_upserted += len(documents)
        except Exception as err:
            logger.error('Error upserting documents in incremental sync: %s', err)

    if total_upserted:
        logger.info('Incremental sync: Upserted %d books.', total_upserted)

    # 2. Delete soft-deleted books
    deleted_books = Book.all_objects.filter(deleted_at__gt=current_last_sync)

    if deleted_books.exists():
        for book in deleted_books:
            try:
                typesense_client.collections[BOOKS_COLLECTION_NAME].documents[str(book.id)].delete()
                logger.info('Incremental sync: Deleted book %d from Typesense.', book.id)
            except Exception as err:
                if not (hasattr(err, 'status_code') and err.status_code == 404):
                    logger.error('Error deleting book %d from Typesense: %s', book.id, err)

    _set_last_sync_time(sync_started_at)
    logger.info('Incremental sync completed.')

def determine_and_run_startup_sync():
    from books.models import Book

    try:
        search_stats = typesense_client.collections[BOOKS_COLLECTION_NAME].retrieve()
        doc_count = search_stats.get('num_documents', 0)

        if doc_count == 0:
            run_full_sync()
        else:
            # Set last_sync_time to epoch so incremental sync picks up
            # any records that may have been missed while Typesense was down.
            _set_last_sync_time(datetime.datetime(1970, 1, 1, tzinfo=datetime.timezone.utc))
            run_incremental_sync()
    except Exception as error:
        logger.error('Error during startup sync: %s', error)
