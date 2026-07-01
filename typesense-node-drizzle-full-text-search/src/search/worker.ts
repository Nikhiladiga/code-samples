import cron from 'node-cron';
import { runIncrementalSync } from './sync';

let isSyncRunning = false;

export function startBackgroundSyncWorker() {
  console.log('Starting background sync worker (every 60 seconds)...');

  cron.schedule('*/60 * * * * *', async () => {
    if (isSyncRunning) {
      console.log('Sync already running, skipping this interval.');
      return;
    }

    isSyncRunning = true;
    try {
      await runIncrementalSync();
    } catch (err) {
      console.error('Error during background incremental sync:', err);
    } finally {
      isSyncRunning = false;
    }
  });
}
