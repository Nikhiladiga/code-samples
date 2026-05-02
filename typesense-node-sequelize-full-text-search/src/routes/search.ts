import { Router, type Request, type Response } from 'express';
import { typesenseClient } from '../search/client';
import { BOOKS_COLLECTION_NAME } from '../search/collections';
import { runFullSync, lastSyncTime } from '../search/sync';
import { getSyncStatus } from '../search/worker';

const router = Router();

// GET /search?q=<query>
router.get('/search', async (req: Request, res: Response) => {
  const query = req.query.q as string || '';
  
  try {
    const searchResults = await typesenseClient.collections(BOOKS_COLLECTION_NAME).documents().search({
      q: query,
      query_by: 'title,authors',
    });
    
    res.json({
      query,
      found: searchResults.found,
      results: searchResults.hits,
      facet_counts: searchResults.facet_counts || [],
    });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// POST /sync - Trigger manual sync
router.post('/sync', async (_req: Request, res: Response) => {
  try {
    // We run full sync here for manual trigger, but you could also run incremental
    await runFullSync();
    
    res.json({
      message: 'Sync completed',
      syncedAt: lastSyncTime.toISOString()
    });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to sync books' });
  }
});

// GET /sync/status - Check sync status
router.get('/sync/status', (_req: Request, res: Response) => {
  res.json({
    lastSyncTime: lastSyncTime.toISOString(),
    syncWorkerRunning: getSyncStatus().syncWorkerRunning
  });
});

export default router;
