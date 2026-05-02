import { Router, type Request, type Response } from 'express';
import { Book } from '../models/Book';
import { typesenseClient } from '../search/client';
import { BOOKS_COLLECTION_NAME } from '../search/collections';

const router = Router();

// Helper for real-time async sync
const syncBookToTypesense = async (book: Book) => {
  try {
    const document = {
      id: book.id.toString(),
      title: book.title,
      authors: Array.isArray(book.authors) ? book.authors : [book.authors],
      publication_year: book.publication_year || 0,
      average_rating: typeof book.average_rating === 'number' ? book.average_rating : parseFloat(book.average_rating || '0'),
      image_url: book.image_url || '',
      ratings_count: book.ratings_count || 0,
    };
    
    console.log(`Syncing book ${book.id} to Typesense:`, document.title);
    await typesenseClient.collections(BOOKS_COLLECTION_NAME).documents().upsert(document);
    console.log(`Successfully synced book ${book.id} to Typesense.`);
  } catch (err) {
    console.error(`Failed to sync book ${book.id} to Typesense:`, err);
    throw err;
  }
};

const deleteBookFromTypesense = async (id: number) => {
  try {
    await typesenseClient.collections(BOOKS_COLLECTION_NAME).documents(id.toString()).delete();
  } catch (err) {
    console.error(`Failed to delete book ${id} from Typesense`, err);
  }
};

// GET /books - Get all books with pagination
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '10', 10);
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await Book.findAndCountAll({
      limit,
      offset,
      order: [['id', 'ASC']]
    });
    
    res.json({
      total: count,
      page,
      limit,
      data: rows
    });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// GET /books/:id - Get a book
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// POST /books - Create a book
router.post('/', async (req: Request, res: Response) => {
  try {
    const book = await Book.create(req.body);
    
    // Real-time async sync (now awaited to ensure consistency in tests)
    await syncBookToTypesense(book);

    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// PUT /books/:id - Update a book
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await book.update(req.body);

    // Real-time async sync (now awaited to ensure consistency in tests)
    await syncBookToTypesense(book);

    res.json(book);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// DELETE /books/:id - Delete a book
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await book.destroy();

    // Real-time async sync
    deleteBookFromTypesense(book.id);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
