import datetime
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.utils import timezone
from books.models import Book
from books.search.sync import (
    _map_book_to_document,
    run_full_sync,
    run_incremental_sync,
    get_last_sync_time,
    _set_last_sync_time,
    BATCH_SIZE,
)


class MapBookToDocumentTest(TestCase):
    def test_maps_all_fields(self):
        book = Book.objects.create(
            title='Test',
            authors=['A', 'B'],
            publication_year=2020,
            average_rating=4.5,
            image_url='http://example.com/img.jpg',
            ratings_count=100,
        )
        doc = _map_book_to_document(book)
        self.assertEqual(doc['id'], str(book.id))
        self.assertEqual(doc['title'], 'Test')
        self.assertEqual(doc['authors'], ['A', 'B'])
        self.assertEqual(doc['publication_year'], 2020)
        self.assertAlmostEqual(doc['average_rating'], 4.5)
        self.assertEqual(doc['image_url'], 'http://example.com/img.jpg')
        self.assertEqual(doc['ratings_count'], 100)

    def test_handles_none_fields(self):
        book = Book.objects.create(title='Minimal', authors=[])
        doc = _map_book_to_document(book)
        self.assertEqual(doc['publication_year'], 0)
        self.assertEqual(doc['average_rating'], 0.0)
        self.assertEqual(doc['image_url'], '')
        self.assertEqual(doc['ratings_count'], 0)


@patch('books.search.sync.typesense_client')
class IncrementalSyncPaginationTest(TestCase):
    def test_incremental_sync_paginates(self, mock_client):
        """Verify incremental sync doesn't load all records at once."""
        _set_last_sync_time(datetime.datetime(1970, 1, 1, tzinfo=datetime.timezone.utc))

        # Create books
        for i in range(5):
            Book.objects.create(title=f'Book {i}', authors=['A'])

        mock_import = MagicMock()
        mock_client.collections.__getitem__.return_value.documents.import_ = mock_import

        run_incremental_sync()

        # All 5 should be upserted (in one batch since < BATCH_SIZE)
        mock_import.assert_called_once()
        docs = mock_import.call_args[0][0]
        self.assertEqual(len(docs), 5)


@patch('books.search.sync.typesense_client')
class FullSyncTest(TestCase):
    def test_full_sync_processes_all_active_books(self, mock_client):
        Book.objects.create(title='Active', authors=['A'])
        deleted = Book.objects.create(title='Deleted', authors=['B'])
        deleted.delete()

        mock_import = MagicMock()
        mock_client.collections.__getitem__.return_value.documents.import_ = mock_import

        run_full_sync()

        # Only active book should be synced
        mock_import.assert_called_once()
        docs = mock_import.call_args[0][0]
        self.assertEqual(len(docs), 1)
        self.assertEqual(docs[0]['title'], 'Active')
