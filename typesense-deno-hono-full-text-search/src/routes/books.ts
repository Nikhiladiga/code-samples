import { Hono } from 'hono';
import {
  type BookInput,
  countActiveBooks,
  findActiveBookById,
  insertBook,
  listActiveBooks,
  softDeleteBook,
  updateBook,
} from '../db/books.ts';
import { deleteBookDocument, upsertBookDocument } from '../search/sync.ts';

const router = new Hono();

const BOOK_FIELDS = [
  'title',
  'authors',
  'publication_year',
  'average_rating',
  'image_url',
  'ratings_count',
] as const;

function pickBookInput(body: Record<string, unknown>): BookInput {
  const input: Record<string, unknown> = {};
  for (const field of BOOK_FIELDS) {
    if (body[field] !== undefined) input[field] = body[field];
  }
  return input as BookInput;
}

router.get('/', async (c) => {
  const page = parseInt(c.req.query('page') ?? '1', 10);
  const limit = parseInt(c.req.query('limit') ?? '10', 10);
  const offset = (page - 1) * limit;

  try {
    const [total, data] = await Promise.all([
      countActiveBooks(),
      listActiveBooks(limit, offset),
    ]);

    return c.json({ total, page, limit, data });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch books' }, 500);
  }
});

router.get('/:id', async (c) => {
  try {
    const book = await findActiveBookById(Number(c.req.param('id')));
    if (!book) return c.json({ error: 'Book not found' }, 404);
    return c.json(book);
  } catch (_error) {
    return c.json({ error: 'Failed to fetch book' }, 500);
  }
});

router.post('/', async (c) => {
  try {
    const book = await insertBook(pickBookInput(await c.req.json()));
    await upsertBookDocument(book).catch((error) =>
      console.error(`Failed to sync book ${book.id} to Typesense:`, error)
    );

    return c.json(book, 201);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

router.put('/:id', async (c) => {
  try {
    const book = await updateBook(Number(c.req.param('id')), pickBookInput(await c.req.json()));
    if (!book) return c.json({ error: 'Book not found' }, 404);

    await upsertBookDocument(book).catch((error) =>
      console.error(`Failed to sync book ${book.id} to Typesense:`, error)
    );

    return c.json(book);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

router.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));

  try {
    const book = await softDeleteBook(id);
    if (!book) return c.json({ error: 'Book not found' }, 404);

    await deleteBookDocument(id).catch((error) =>
      console.error(`Failed to delete book ${id} from Typesense:`, error)
    );

    return c.body(null, 204);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default router;
