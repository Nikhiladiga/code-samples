import cron from 'node-cron';
import { runIncrementalSync } from './sync';

let isSyncRunning = false;

export function startBackgroundSyncWorker() {
  console.log('Starting background periodic sync worker (every 60s)...');
  
  // Runs every minute
  cron.schedule('* * * * *', async () => {
    if (isSyncRunning) {
      console.log('Sync already running, skipping this iteration.');
      return;
    }

    isSyncRunning = true;
    try {
      await runIncrementalSync();
    } catch (error) {
      console.error('Error in background sync worker:', error);
    } finally {
      isSyncRunning = false;
    }
  });
}

export function getSyncStatus() {
  return {
    syncWorkerRunning: isSyncRunning,
  };
}
