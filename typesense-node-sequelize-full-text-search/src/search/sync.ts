import { Op } from 'sequelize';
import { Book } from '../models/Book';
import { typesenseClient } from './client';
import { BOOKS_COLLECTION_NAME } from './collections';

export let lastSyncTime: Date = new Date(0);

const BATCH_SIZE = 1000;

export async function runFullSync() {
  console.log('Running full sync...');
  // Stamp the time before reading anything. Taking it at the end would exclude
  // rows changed while the sync was running, and they would never be retried.
  const syncStartedAt = new Date();
  let lastId = 0;
  let hasMore = true;
  let totalProcessed = 0;
  let failed = false;

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
      failed = true;
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
      failed = true;
      break; 
    }
  }

  // Only advance lastSyncTime when the whole run succeeded, so a partial
  // failure is retried on the next run instead of being skipped forever.
  if (failed) {
    console.warn(`Full sync incomplete; lastSyncTime stays at ${lastSyncTime.toISOString()}`);
    return;
  }

  lastSyncTime = syncStartedAt;
  console.log('Full sync completed.');
}

export async function runIncrementalSync() {
  // Stamp the time before reading anything, and hold the window open against
  // the previous stamp for the whole run.
  const syncStartedAt = new Date();
  const since = lastSyncTime;
  console.log(`Running incremental sync since ${since.toISOString()}...`);

  let failed = false;

  // 1. Find newly created or updated books
  let updatedBooks: Book[] = [];
  try {
    updatedBooks = await Book.findAll({
      where: {
        updated_at: {
          [Op.gt]: since,
        },
      },
      paranoid: true, // Only active
    });
  } catch (err) {
    console.error('Database error during incremental sync upsert fetching:', err);
    failed = true;
  }

  if (!failed && updatedBooks.length > 0) {
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
      failed = true;
    }
  }

  // 2. Find soft-deleted books
  let deletedBooks: Book[] = [];
  if (!failed) {
    try {
      deletedBooks = await Book.findAll({
        where: {
          deleted_at: {
            [Op.gt]: since,
          },
        },
        paranoid: false, // Include soft-deleted
      });
    } catch (err) {
      console.error('Database error during incremental sync delete fetching:', err);
      failed = true;
    }
  }

  if (!failed && deletedBooks.length > 0) {
    for (const book of deletedBooks) {
      try {
        await typesenseClient.collections(BOOKS_COLLECTION_NAME).documents(book.id.toString()).delete();
        console.log(`Incremental sync: Deleted book ${book.id} from Typesense.`);
      } catch (err) {
        // Typesense might return 404 if document doesn't exist, which is fine
        const error = err as { httpStatus?: number };
        if (error.httpStatus !== 404) {
          console.error(`Error deleting book ${book.id} from Typesense`, err);
          failed = true;
        }
      }
    }
  }

  // Only advance lastSyncTime when the whole run succeeded.
  if (failed) {
    console.warn(`Incremental sync incomplete; lastSyncTime stays at ${lastSyncTime.toISOString()}`);
    return;
  }

  lastSyncTime = syncStartedAt;
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
      // Typesense has data. Catch up from epoch so records that changed while
      // the server was down are backfilled. Seeding from MAX(updated_at) would
      // make the incremental query match zero rows by construction.
      lastSyncTime = new Date(0);
      await runIncrementalSync();
    }
  } catch (error) {
    console.error('Error during startup sync:', error);
  }
}
