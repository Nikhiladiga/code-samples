import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Book
from .search import typesense_client, BOOKS_COLLECTION_NAME, run_full_sync, get_sync_status
from .search.sync import last_sync_time
import datetime

# Helper for real-time sync
def sync_book_to_typesense(book):
    try:
        document = {
            'id': str(book.id),
            'title': book.title,
            'authors': book.authors if isinstance(book.authors, list) else [book.authors],
            'publication_year': book.publication_year or 0,
            'average_rating': float(book.average_rating) if book.average_rating else 0.0,
            'image_url': book.image_url or '',
            'ratings_count': book.ratings_count or 0,
        }
        print(f"Syncing book {book.id} to Typesense: {document['title']}")
        typesense_client.collections[BOOKS_COLLECTION_NAME].documents.upsert(document)
        print(f"Successfully synced book {book.id} to Typesense.")
    except Exception as err:
        print(f"Failed to sync book {book.id} to Typesense: {err}")
        # In a real app, you might want to handle this or retry
        pass

def delete_book_from_typesense(book_id):
    try:
        typesense_client.collections[BOOKS_COLLECTION_NAME].documents[str(book_id)].delete()
    except Exception as err:
        print(f"Failed to delete book {book_id} from Typesense: {err}")

# GET/POST /books
@csrf_exempt
@require_http_methods(["GET", "POST"])
def books_list_create(request):
    if request.method == 'GET':
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 10))
        offset = (page - 1) * limit
        
        # Using ActiveBookManager (Book.objects)
        queryset = Book.objects.all().order_by('id')
        total = queryset.count()
        books = list(queryset[offset:offset+limit].values())
        
        return JsonResponse({
            'total': total,
            'page': page,
            'limit': limit,
            'data': books
        })
        
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            book = Book.objects.create(**data)
            
            # Real-time async sync
            sync_book_to_typesense(book)
            
            # Convert to dict for JSON response, handle dates
            response_data = {
                'id': book.id,
                'title': book.title,
                'authors': book.authors,
                'publication_year': book.publication_year,
                'average_rating': book.average_rating,
                'image_url': book.image_url,
                'ratings_count': book.ratings_count,
            }
            return JsonResponse(response_data, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

# GET/PUT/DELETE /books/<id>
@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def books_detail(request, pk):
    try:
        book = Book.objects.get(pk=pk)
    except Book.DoesNotExist:
        return JsonResponse({'error': 'Book not found'}, status=404)
        
    if request.method == 'GET':
        response_data = {
            'id': book.id,
            'title': book.title,
            'authors': book.authors,
            'publication_year': book.publication_year,
            'average_rating': book.average_rating,
            'image_url': book.image_url,
            'ratings_count': book.ratings_count,
        }
        return JsonResponse(response_data)
        
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            for key, value in data.items():
                if hasattr(book, key):
                    setattr(book, key, value)
            book.save()
            
            # Real-time sync
            sync_book_to_typesense(book)
            
            response_data = {
                'id': book.id,
                'title': book.title,
                'authors': book.authors,
                'publication_year': book.publication_year,
                'average_rating': book.average_rating,
                'image_url': book.image_url,
                'ratings_count': book.ratings_count,
            }
            return JsonResponse(response_data)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    elif request.method == 'DELETE':
        try:
            book_id = book.id
            book.delete() # Sets deleted_at via soft delete manager
            
            # Real-time sync
            delete_book_from_typesense(book_id)
            
            return JsonResponse({}, status=204)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

# GET /search
@csrf_exempt
@require_http_methods(["GET"])
def search(request):
    query = request.GET.get('q', '')
    
    try:
        search_results = typesense_client.collections[BOOKS_COLLECTION_NAME].documents.search({
            'q': query,
            'query_by': 'title,authors',
        })
        
        return JsonResponse({
            'query': query,
            'found': search_results.get('found', 0),
            'results': search_results.get('hits', []),
            'facet_counts': search_results.get('facet_counts', []),
        })
    except Exception as error:
        return JsonResponse({'error': f'Failed to fetch books: {error}'}, status=500)

# POST /sync
@csrf_exempt
@require_http_methods(["POST"])
def manual_sync(request):
    try:
        run_full_sync()
        import books.search.sync as sync_module
        return JsonResponse({
            'message': 'Sync completed',
            'syncedAt': sync_module.last_sync_time.isoformat()
        })
    except Exception as error:
        return JsonResponse({'error': f'Failed to sync books: {error}'}, status=500)

# GET /sync/status
@require_http_methods(["GET"])
def sync_status(request):
    import books.search.sync as sync_module
    status = get_sync_status()
    return JsonResponse({
        'lastSyncTime': sync_module.last_sync_time.isoformat(),
        'syncWorkerRunning': status['syncWorkerRunning'],
        'syncJobActive': status['syncJobActive']
    })
