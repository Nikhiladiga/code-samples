import logging
import threading
from apscheduler.schedulers.background import BackgroundScheduler
from .sync import run_incremental_sync

logger = logging.getLogger(__name__)

_sync_job_lock = threading.Lock()
_scheduler = None

def _sync_job():
    acquired = _sync_job_lock.acquire(blocking=False)
    if not acquired:
        logger.info('Sync already running, skipping this iteration.')
        return

    try:
        run_incremental_sync()
    except Exception as error:
        logger.error('Error in background sync worker: %s', error)
    finally:
        _sync_job_lock.release()

def start_background_sync_worker():
    global _scheduler
    if _scheduler is not None:
        return

    logger.info('Starting background periodic sync worker (every 60s)...')
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(_sync_job, 'interval', seconds=60)
    _scheduler.start()

def get_sync_status():
    return {
        'syncWorkerRunning': _scheduler is not None and _scheduler.running,
        'syncJobActive': _sync_job_lock.locked()
    }
