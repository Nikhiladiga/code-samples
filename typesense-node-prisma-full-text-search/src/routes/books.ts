import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/database';
import type { Book } from '@prisma/client';
import { typesenseClient } from '../search/client';
import { BOOKS_COLLECTION_NAME } from '../search/collections';

const router = Router();

// Helper for real-time async sync
const syncBookToTypesense = async (book: Book) => {
  try {
    // Prisma returns JSON as Prisma.JsonValue, we cast to array for typesense
    const authorsArray = Array.isArray(book.authors) ? book.authors : [book.authors];
    
    const document = {
      id: book.id.toString(),
      title: book.title,
      authors: authorsArray as string[],
      publication_year: book.publication_year || 0,
      average_rating: book.average_rating ? Number(book.average_rating) : 0,
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
    const [count, rows] = await Promise.all([
      prisma.book.count({ where: { deleted_at: null } }),
      prisma.book.findMany({
        where: { deleted_at: null },
        skip: offset,
        take: limit,
        orderBy: { id: 'asc' }
      })
    ]);
    
    res.json({
      total: count,
      page,
      limit,
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// GET /books/:id - Get a book
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const book = await prisma.book.findUnique({
      where: { 
        id: parseInt(req.params.id),
        deleted_at: null 
      }
    });
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// POST /books - Create a book
router.post('/', async (req: Request, res: Response) => {
  try {
    const book = await prisma.book.create({
      data: req.body
    });
    
    // Real-time async sync
    await syncBookToTypesense(book);

    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// PUT /books/:id - Update a book
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id);
    const existingBook = await prisma.book.findUnique({ where: { id: bookId, deleted_at: null } });
    
    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: req.body
    });

    // Real-time async sync
    await syncBookToTypesense(updatedBook);

    res.json(updatedBook);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// DELETE /books/:id - Delete a book
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id);
    const existingBook = await prisma.book.findUnique({ where: { id: bookId, deleted_at: null } });
    
    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Soft delete
    await prisma.book.update({
      where: { id: bookId },
      data: { deleted_at: new Date() }
    });

    // Real-time async sync
    deleteBookFromTypesense(bookId);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
