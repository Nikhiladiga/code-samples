import sys
from django.apps import AppConfig

class BooksConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'books'

    def ready(self):
        # Avoid running during management commands (like migrate, makemigrations)
        if 'manage.py' in sys.argv:
            if 'runserver' not in sys.argv:
                return
        
        # Import inside ready() to avoid AppRegistryNotReady errors
        from .search import (
            initialize_typesense,
            determine_and_run_startup_sync,
            start_background_sync_worker
        )
        import threading

        # Run Typesense initialization and sync in a background thread
        # to avoid blocking Django startup.
        def _startup_sequence():
            try:
                print('Initializing Typesense...')
                initialize_typesense()
                
                print('Running startup sync...')
                try:
                    determine_and_run_startup_sync()
                except Exception as sync_err:
                    print(f"Startup sync skipped (database might not be migrated yet): {sync_err}")
                
                start_background_sync_worker()
            except Exception as e:
                print(f"Failed to start background sync worker: {e}")

        # In development with autoreload, ready() is called twice. 
        # Using a background thread ensures we don't block the main thread.
        # But we only want to run it once.
        import os
        if os.environ.get('RUN_MAIN') == 'true' or not sys.argv[0].endswith('manage.py'):
            # Only run if we are in the main worker process (e.g., when RUN_MAIN is set by autoreloader)
            thread = threading.Thread(target=_startup_sequence, daemon=True)
            thread.start()
