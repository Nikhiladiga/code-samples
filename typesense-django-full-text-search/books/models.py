from django.db import models
from django.utils import timezone

class ActiveBookManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class TolerantJSONField(models.JSONField):
    def from_db_value(self, value, expression, connection):
        if isinstance(value, (list, dict)):
            return value
        return super().from_db_value(value, expression, connection)

class Book(models.Model):
    title = models.CharField(max_length=255)
    authors = TolerantJSONField(default=list)
    publication_year = models.IntegerField(null=True, blank=True)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    image_url = models.CharField(max_length=255, null=True, blank=True)
    ratings_count = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    # Use ActiveBookManager by default to hide soft-deleted records
    objects = ActiveBookManager()
    # Provide access to all objects, including soft-deleted ones
    all_objects = models.Manager()

    class Meta:
        db_table = 'books'
        ordering = ['id']

    def delete(self, using=None, keep_parents=False):
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return self.title
