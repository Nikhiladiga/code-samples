import { Router, type Request, type Response } from 'express';
import { db } from '../config/database';
import { books, type Book } from '../db/schema';
import { eq, isNull, count } from 'drizzle-orm';
import { typesenseClient } from '../search/client';
import { BOOKS_COLLECTION_NAME } from '../search/collections';

const router = Router();

const syncBookToTypesense = async (book: Book) => {
  try {
    const authorsArray = Array.isArray(book.authors) ? book.authors : [book.authors];
    
    const document = {
      id: book.id.toString(),
      title: book.title,
      authors: authorsArray as string[],
      publication_year: book.publicationYear || 0,
      average_rating: book.averageRating ? Number(book.averageRating) : 0,
      image_url: book.imageUrl || '',
      ratings_count: book.ratingsCount || 0,
    };
    
    await typesenseClient.collections(BOOKS_COLLECTION_NAME).documents().upsert(document);
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

router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '10', 10);
  const offset = (page - 1) * limit;

  try {
    const totalCountRes = await db.select({ value: count() }).from(books).where(isNull(books.deletedAt));
    const totalCount = totalCountRes[0].value;

    const rows = await db.select()
      .from(books)
      .where(isNull(books.deletedAt))
      .limit(limit)
      .offset(offset)
      .orderBy(books.id);
    
    res.json({
      total: totalCount,
      page,
      limit,
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id as string);
    const result = await db.select().from(books).where(eq(books.id, bookId));
    const book = result.find(b => b.deletedAt === null);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await db.insert(books).values(req.body).returning();
    const book = result[0];
    
    await syncBookToTypesense(book);

    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id as string);
    const existing = await db.select().from(books).where(eq(books.id, bookId));
    
    if (existing.length === 0 || existing[0].deletedAt !== null) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const updated = await db.update(books)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(books.id, bookId))
      .returning();

    const updatedBook = updated[0];
    await syncBookToTypesense(updatedBook);

    res.json(updatedBook);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id as string);
    const existing = await db.select().from(books).where(eq(books.id, bookId));
    
    if (existing.length === 0 || existing[0].deletedAt !== null) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await db.update(books).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(books.id, bookId));

    await deleteBookFromTypesense(bookId);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
