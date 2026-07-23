import sys
import logging
from django.apps import AppConfig

logger = logging.getLogger(__name__)

class BooksConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'books'

    def ready(self):
        # Avoid running during management commands (like migrate, makemigrations)
        if 'manage.py' in sys.argv and 'runserver' not in sys.argv:
            return

        from .search import (
            initialize_typesense,
            determine_and_run_startup_sync,
            start_background_sync_worker
        )
        import threading

        def _startup_sequence():
            try:
                logger.info('Initializing Typesense...')
                initialize_typesense()

                logger.info('Running startup sync...')
                try:
                    determine_and_run_startup_sync()
                except Exception as sync_err:
                    logger.warning('Startup sync skipped (database might not be migrated yet): %s', sync_err)

                start_background_sync_worker()
            except Exception as e:
                logger.error('Failed to start background sync worker: %s', e)

        import os
        if os.environ.get('RUN_MAIN') == 'true' or not sys.argv[0].endswith('manage.py'):
            thread = threading.Thread(target=_startup_sequence, daemon=True)
            thread.start()
