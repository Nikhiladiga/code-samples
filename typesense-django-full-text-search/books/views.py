import json
import logging
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Book
from .search import typesense_client, BOOKS_COLLECTION_NAME, run_full_sync, get_sync_status
from .search.sync import _map_book_to_document, get_last_sync_time

logger = logging.getLogger(__name__)

# Allowlist of fields that can be set via API
MUTABLE_FIELDS = {'title', 'authors', 'publication_year', 'average_rating', 'image_url', 'ratings_count'}

def _book_to_response(book):
    return {
        'id': book.id,
        'title': book.title,
        'authors': book.authors,
        'publication_year': book.publication_year,
        'average_rating': book.average_rating,
        'image_url': book.image_url,
        'ratings_count': book.ratings_count,
    }

def sync_book_to_typesense(book):
    try:
        document = _map_book_to_document(book)
        typesense_client.collections[BOOKS_COLLECTION_NAME].documents.upsert(document)
    except Exception as err:
        logger.error('Failed to sync book %d to Typesense: %s', book.id, err)

def delete_book_from_typesense(book_id):
    try:
        typesense_client.collections[BOOKS_COLLECTION_NAME].documents[str(book_id)].delete()
    except Exception as err:
        logger.error('Failed to delete book %d from Typesense: %s', book_id, err)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def books_list_create(request):
    if request.method == 'GET':
        try:
            page = max(int(request.GET.get('page', 1)), 1)
            limit = min(max(int(request.GET.get('limit', 10)), 1), 100)
        except (ValueError, TypeError):
            return JsonResponse({'error': 'page and limit must be integers'}, status=400)

        offset = (page - 1) * limit

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
            filtered = {k: v for k, v in data.items() if k in MUTABLE_FIELDS}
            book = Book.objects.create(**filtered)
            sync_book_to_typesense(book)
            return JsonResponse(_book_to_response(book), status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def books_detail(request, pk):
    try:
        book = Book.objects.get(pk=pk)
    except Book.DoesNotExist:
        return JsonResponse({'error': 'Book not found'}, status=404)

    if request.method == 'GET':
        return JsonResponse(_book_to_response(book))

    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            for key, value in data.items():
                if key in MUTABLE_FIELDS:
                    setattr(book, key, value)
            book.save()
            sync_book_to_typesense(book)
            return JsonResponse(_book_to_response(book))
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    elif request.method == 'DELETE':
        try:
            book_id = book.id
            book.delete()
            delete_book_from_typesense(book_id)
            return HttpResponse(status=204)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

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
        return JsonResponse({'error': str(error)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def manual_sync(request):
    try:
        run_full_sync()
        return JsonResponse({
            'message': 'Sync completed',
            'syncedAt': get_last_sync_time().isoformat()
        })
    except Exception as error:
        return JsonResponse({'error': str(error)}, status=500)

@require_http_methods(["GET"])
def sync_status(request):
    status = get_sync_status()
    return JsonResponse({
        'lastSyncTime': get_last_sync_time().isoformat(),
        'syncWorkerRunning': status['syncWorkerRunning'],
        'syncJobActive': status['syncJobActive']
    })
