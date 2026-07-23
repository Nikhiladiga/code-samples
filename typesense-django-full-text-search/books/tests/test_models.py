from django.test import TestCase
from django.utils import timezone
from books.models import Book


class BookSoftDeleteTest(TestCase):
    def test_delete_sets_deleted_at(self):
        book = Book.objects.create(title='Test Book', authors=['Author'])
        self.assertIsNone(book.deleted_at)
        book.delete()
        book.refresh_from_db()
        self.assertIsNotNone(book.deleted_at)

    def test_default_manager_excludes_deleted(self):
        book = Book.objects.create(title='Test Book', authors=['Author'])
        book.delete()
        self.assertEqual(Book.objects.count(), 0)

    def test_all_objects_includes_deleted(self):
        book = Book.objects.create(title='Test Book', authors=['Author'])
        book.delete()
        self.assertEqual(Book.all_objects.count(), 1)


class BookFieldTest(TestCase):
    def test_authors_stored_as_list(self):
        book = Book.objects.create(title='Test', authors=['A', 'B'])
        book.refresh_from_db()
        self.assertEqual(book.authors, ['A', 'B'])

    def test_optional_fields_default_to_none(self):
        book = Book.objects.create(title='Test', authors=[])
        self.assertIsNone(book.publication_year)
        self.assertIsNone(book.average_rating)
        self.assertIsNone(book.ratings_count)
