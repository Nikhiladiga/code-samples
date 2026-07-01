import { Router, type Request, type Response } from 'express';
import { typesenseClient } from '../search/client';
import { BOOKS_COLLECTION_NAME } from '../search/collections';
import { runFullSync } from '../search/sync';

const router = Router();

// Perform search
router.get('/search', async (req: Request, res: Response) => {
  const { q, query_by, ...otherParams } = req.query;

  if (!q || !query_by) {
    return res.status(400).json({ error: 'Missing required query parameters: q and query_by' });
  }

  try {
    const searchResults = await typesenseClient
      .collections(BOOKS_COLLECTION_NAME)
      .documents()
      .search({
        q: q as string,
        query_by: query_by as string,
        ...otherParams,
      });

    res.json(searchResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Manual Sync endpoint
router.post('/sync', async (req: Request, res: Response) => {
  try {
    await runFullSync();
    res.json({ message: 'Sync completed successfully' });
  } catch (error) {
    console.error('Sync failed:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

export default router;
