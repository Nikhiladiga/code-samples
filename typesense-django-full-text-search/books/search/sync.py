import datetime
from django.utils import timezone
from .client import typesense_client
from .collections import BOOKS_COLLECTION_NAME

# Global state to keep track of last sync time
last_sync_time = datetime.datetime(1970, 1, 1, tzinfo=datetime.timezone.utc)

BATCH_SIZE = 1000

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
    global last_sync_time
    print('Running full sync...')
    from books.models import Book
    
    last_id = 0
    has_more = True
    total_processed = 0

    while has_more:
        try:
            # Only fetch active records (ActiveBookManager)
            books = list(Book.objects.filter(id__gt=last_id).order_by('id')[:BATCH_SIZE])
        except Exception as err:
            print(f'Database error during full sync fetching: {err}')
            break

        if not books:
            has_more = False
            break

        last_id = books[-1].id

        documents = [_map_book_to_document(b) for b in books]

        try:
            typesense_client.collections[BOOKS_COLLECTION_NAME].documents.import_(documents, {'action': 'upsert'})
            total_processed += len(documents)
            print(f'Full sync: Processed {total_processed} books.')
        except Exception as err:
            print(f'Error importing documents during full sync: {err}')
            break

    last_sync_time = timezone.now()
    print('Full sync completed.')

def run_incremental_sync():
    global last_sync_time
    
    sync_started_at = timezone.now()
    
    print(f'Running incremental sync since {last_sync_time.isoformat()}...')
    from books.models import Book
    
    # 1. Find newly created or updated books (only active ones)
    updated_books = Book.objects.filter(updated_at__gt=last_sync_time)

    if updated_books.exists():
        documents = [_map_book_to_document(b) for b in updated_books]
        try:
            typesense_client.collections[BOOKS_COLLECTION_NAME].documents.import_(documents, {'action': 'upsert'})
            print(f'Incremental sync: Upserted {len(documents)} books.')
        except Exception as err:
            print(f'Error upserting documents in incremental sync: {err}')

    # 2. Find soft-deleted books
    deleted_books = Book.all_objects.filter(deleted_at__gt=last_sync_time)

    if deleted_books.exists():
        for book in deleted_books:
            try:
                typesense_client.collections[BOOKS_COLLECTION_NAME].documents[str(book.id)].delete()
                print(f'Incremental sync: Deleted book {book.id} from Typesense.')
            except Exception as err:
                # 404 is fine if the document doesn't exist
                if not (hasattr(err, 'status_code') and err.status_code == 404):
                    print(f'Error deleting book {book.id} from Typesense: {err}')

    last_sync_time = sync_started_at
    print('Incremental sync completed.')

def determine_and_run_startup_sync():
    global last_sync_time
    from books.models import Book
    
    try:
        search_stats = typesense_client.collections[BOOKS_COLLECTION_NAME].retrieve()
        doc_count = search_stats.get('num_documents', 0)

        if doc_count == 0:
            # Empty Typesense collection, full sync
            run_full_sync()
        else:
            # Typesense has data, get latest updated_at from DB (across all records, including soft-deleted)
            latest_book = Book.all_objects.order_by('-updated_at').first()

            if latest_book and latest_book.updated_at:
                last_sync_time = latest_book.updated_at
            
            run_incremental_sync()
    except Exception as error:
        print(f'Error during startup sync: {error}')
