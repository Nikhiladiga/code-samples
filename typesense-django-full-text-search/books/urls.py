from django.urls import path
from . import views

urlpatterns = [
    path('books/', views.books_list_create, name='books_list_create'),
    path('books/<int:pk>/', views.books_detail, name='books_detail'),
    path('search', views.search, name='search'),
    path('sync', views.manual_sync, name='manual_sync'),
    path('sync/status', views.sync_status, name='sync_status'),
]
