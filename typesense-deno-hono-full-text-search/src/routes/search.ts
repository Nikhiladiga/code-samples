import { Hono } from 'hono';
import { typesenseClient } from '../search/client.ts';
import { BOOKS_COLLECTION_NAME } from '../search/collections.ts';
import { getLastSyncTime, runFullSync } from '../search/sync.ts';
import { isWorkerRunning } from '../search/worker.ts';

const router = new Hono();

router.get('/search', async (c) => {
  const query = c.req.query('q') ?? '';

  try {
    const searchResults = await typesenseClient
      .collections(BOOKS_COLLECTION_NAME)
      .documents()
      .search({ q: query, query_by: 'title,authors' });

    return c.json({
      query,
      found: searchResults.found,
      results: searchResults.hits,
      facet_counts: searchResults.facet_counts ?? [],
    });
  } catch (error) {
    console.error('Search failed:', error);
    return c.json({ error: 'Failed to fetch books' }, 500);
  }
});

router.post('/sync', async (c) => {
  try {
    const result = await runFullSync();
    if (result.failed) return c.json({ error: 'Failed to sync books' }, 500);

    return c.json({
      message: 'Sync completed',
      syncedAt: getLastSyncTime().toISOString(),
    });
  } catch (error) {
    console.error('Manual sync failed:', error);
    return c.json({ error: 'Failed to sync books' }, 500);
  }
});

router.get('/sync/status', (c) =>
  c.json({
    lastSyncTime: getLastSyncTime().toISOString(),
    syncWorkerRunning: isWorkerRunning(),
  }));

export default router;
