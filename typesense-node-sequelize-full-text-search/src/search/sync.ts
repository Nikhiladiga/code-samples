import { Op } from 'sequelize';
import { Book } from '../models/Book';
import { typesenseClient } from './client';
import { BOOKS_COLLECTION_NAME } from './collections';

export let lastSyncTime: Date = new Date(0);

const BATCH_SIZE = 1000;

export async function runFullSync() {
  console.log('Running full sync...');
  let lastId = 0;
  let hasMore = true;
  let totalProcessed = 0;

  while (hasMore) {
    let books: Book[];
    try {
      books = await Book.findAll({
        where: { id: { [Op.gt]: lastId } },
        limit: BATCH_SIZE,
        order: [['id', 'ASC']],
        paranoid: true, // Only fetch active records
      });
    } catch (err) {
      console.error('Database error during full sync fetching:', err);
      break; // Abort this sync run gracefully on DB failure
    }

    if (books.length === 0) {
      hasMore = false;
      break;
    }

    lastId = books[books.length - 1].id;

    const documents = books.map((b) => ({
      id: b.id.toString(),
      title: b.title,
      authors: b.authors,
      publication_year: b.publication_year || 0,
      average_rating: b.average_rating || 0.0,
      image_url: b.image_url || '',
      ratings_count: b.ratings_count || 0,
    }));

    try {
      await typesenseClient.collections(BOOKS_COLLECTION_NAME).documents().import(documents, { action: 'upsert' });
      totalProcessed += documents.length;
      console.log(`Full sync: Processed ${totalProcessed} books.`);
    } catch (err) {
      console.error('Error importing documents during full sync', err);
      // We can choose to break or continue here; breaking is safer on Typesense errors
      break; 
    }
  }

  // Update lastSyncTime to now
  lastSyncTime = new Date();
  console.log('Full sync completed.');
}

export async function runIncrementalSync() {
  console.log(`Running incremental sync since ${lastSyncTime.toISOString()}...`);
  
  // 1. Find newly created or updated books
  const updatedBooks = await Book.findAll({
    where: {
      updated_at: {
        [Op.gt]: lastSyncTime,
      },
    },
    paranoid: true, // Only active
  });

  if (updatedBooks.length > 0) {
    const documents = updatedBooks.map((b) => ({
      id: b.id.toString(),
      title: b.title,
      authors: b.authors,
      publication_year: b.publication_year || 0,
      average_rating: b.average_rating || 0.0,
      image_url: b.image_url || '',
      ratings_count: b.ratings_count || 0,
    }));

    try {
      await typesenseClient.collections(BOOKS_COLLECTION_NAME).documents().import(documents, { action: 'upsert' });
      console.log(`Incremental sync: Upserted ${documents.length} books.`);
    } catch (err) {
      console.error('Error upserting documents in incremental sync', err);
    }
  }

  // 2. Find soft-deleted books
  const deletedBooks = await Book.findAll({
    where: {
      deleted_at: {
        [Op.gt]: lastSyncTime,
      },
    },
    paranoid: false, // Include soft-deleted
  });

  if (deletedBooks.length > 0) {
    for (const book of deletedBooks) {
      try {
        await typesenseClient.collections(BOOKS_COLLECTION_NAME).documents(book.id.toString()).delete();
        console.log(`Incremental sync: Deleted book ${book.id} from Typesense.`);
      } catch (err) {
        // Typesense might return 404 if document doesn't exist, which is fine
        const error = err as { httpStatus?: number };
        if (error.httpStatus !== 404) {
          console.error(`Error deleting book ${book.id} from Typesense`, err);
        }
      }
    }
  }

  lastSyncTime = new Date();
  console.log('Incremental sync completed.');
}

export async function determineAndRunStartupSync() {
  try {
    const searchStats = await typesenseClient.collections(BOOKS_COLLECTION_NAME).retrieve();
    const docCount = searchStats.num_documents;

    if (docCount === 0) {
      // Empty Typesense collection, full sync
      await runFullSync();
    } else {
      // Typesense has data, get latest updated_at from DB
      const latestBook = await Book.findOne({
        order: [['updated_at', 'DESC']],
        paranoid: false, // Check across all records
      });

      if (latestBook?.updated_at) {
        lastSyncTime = latestBook.updated_at;
      }
      
      await runIncrementalSync();
    }
  } catch (error) {
    console.error('Error during startup sync:', error);
  }
}
