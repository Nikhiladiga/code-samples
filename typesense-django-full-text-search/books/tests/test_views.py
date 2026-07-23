import json
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from books.models import Book


@patch('books.views.sync_book_to_typesense')
@patch('books.views.delete_book_from_typesense')
class BookViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.book = Book.objects.create(
            title='Existing Book',
            authors=['Author One'],
            publication_year=2020,
        )

    def test_list_books(self, mock_delete, mock_sync):
        response = self.client.get('/books/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['total'], 1)
        self.assertEqual(len(data['data']), 1)

    def test_list_books_invalid_page(self, mock_delete, mock_sync):
        response = self.client.get('/books/?page=abc')
        self.assertEqual(response.status_code, 400)

    def test_list_books_limit_clamped(self, mock_delete, mock_sync):
        response = self.client.get('/books/?limit=999')
        data = response.json()
        self.assertEqual(data['limit'], 100)

    def test_list_books_negative_page(self, mock_delete, mock_sync):
        response = self.client.get('/books/?page=-5')
        data = response.json()
        self.assertEqual(data['page'], 1)

    def test_create_book(self, mock_delete, mock_sync):
        response = self.client.post(
            '/books/',
            data=json.dumps({'title': 'New Book', 'authors': ['A']}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['title'], 'New Book')
        mock_sync.assert_called_once()

    def test_create_book_rejects_protected_fields(self, mock_delete, mock_sync):
        response = self.client.post(
            '/books/',
            data=json.dumps({
                'title': 'Hacked',
                'authors': ['X'],
                'id': 9999,
                'deleted_at': '2020-01-01T00:00:00Z',
            }),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        book = Book.objects.get(title='Hacked')
        self.assertNotEqual(book.id, 9999)
        self.assertIsNone(book.deleted_at)

    def test_update_book_allowlist(self, mock_delete, mock_sync):
        response = self.client.put(
            f'/books/{self.book.id}/',
            data=json.dumps({'title': 'Updated', 'deleted_at': '2020-01-01T00:00:00Z'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.book.refresh_from_db()
        self.assertEqual(self.book.title, 'Updated')
        self.assertIsNone(self.book.deleted_at)

    def test_delete_returns_204_no_body(self, mock_delete, mock_sync):
        response = self.client.delete(f'/books/{self.book.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, b'')
        mock_delete.assert_called_once_with(self.book.id)

    def test_get_nonexistent_book_returns_404(self, mock_delete, mock_sync):
        response = self.client.get('/books/99999/')
        self.assertEqual(response.status_code, 404)


@patch('books.views.typesense_client')
class SearchViewTest(TestCase):
    def test_search_returns_results(self, mock_client):
        mock_search = MagicMock(return_value={
            'found': 1,
            'hits': [{'document': {'title': 'Test'}}],
            'facet_counts': [],
        })
        mock_client.collections.__getitem__.return_value.documents.search = mock_search

        response = self.client.get('/search/?q=test')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['found'], 1)
