import { env } from '../config/env.ts';
import { runIncrementalSync } from './sync.ts';

let timer: ReturnType<typeof setInterval> | undefined;
let workerRunning = false;
let syncInProgress = false;

export function isWorkerRunning(): boolean {
  return workerRunning;
}

export function startBackgroundSyncWorker(): void {
  if (workerRunning) return;

  const intervalMs = env.SYNC_INTERVAL_SECONDS * 1000;
  console.log(`Starting background sync worker (every ${env.SYNC_INTERVAL_SECONDS}s)...`);

  timer = setInterval(async () => {
    if (syncInProgress) {
      console.log('Sync already in progress — skipping this tick.');
      return;
    }

    syncInProgress = true;
    try {
      await runIncrementalSync();
    } catch (error) {
      console.error('Background sync threw:', error);
    } finally {
      syncInProgress = false;
    }
  }, intervalMs);

  workerRunning = true;
}

export function stopBackgroundSyncWorker(): void {
  if (timer !== undefined) clearInterval(timer);
  timer = undefined;
  workerRunning = false;
}
