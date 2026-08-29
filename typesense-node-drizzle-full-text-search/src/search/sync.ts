import { db } from '../config/database';
import { books, type Book } from '../db/schema';
import { typesenseClient } from './client';
import { BOOKS_COLLECTION_NAME } from './collections';
import { gt, isNull, and, isNotNull } from 'drizzle-orm';

export let lastSyncTime: Date = new Date(0);

const BATCH_SIZE = 1000;

const mapBookToTypesense = (b: Book) => ({
  id: b.id.toString(),
  title: b.title,
  authors: (Array.isArray(b.authors) ? b.authors : [b.authors]) as string[],
  publication_year: b.publicationYear || 0,
  average_rating: b.averageRating ? Number(b.averageRating) : 0,
  image_url: b.imageUrl || '',
  ratings_count: b.ratingsCount || 0,
});

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
    let fetchedBooks: Book[];
    try {
      fetchedBooks = await db.select()
        .from(books)
        .where(
          and(
            gt(books.id, lastId),
            isNull(books.deletedAt)
          )
        )
        .limit(BATCH_SIZE)
        .orderBy(books.id);
    } catch (err) {
      console.error('Database error during full sync fetching:', err);
      failed = true;
      break;
    }

    if (fetchedBooks.length === 0) {
      hasMore = false;
      break;
    }

    lastId = fetchedBooks[fetchedBooks.length - 1].id;
    const documents = fetchedBooks.map(mapBookToTypesense);

    try {
      await typesenseClient.collections(BOOKS_COLLECTION_NAME).documents().import(documents, { action: 'upsert' });
      totalProcessed += documents.length;
      console.log(`Full sync: Processed ${totalProcessed} books.`);
    } catch (err) {
      console.error('Error importing documents during full sync', err);
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

  // 1. Process newly created or updated books in batches
  let lastUpsertId = 0;
  let hasMoreUpserts = true;
  let totalUpserted = 0;

  while (hasMoreUpserts) {
    let updatedBooks: Book[];
    try {
      updatedBooks = await db.select()
        .from(books)
        .where(
          and(
            gt(books.updatedAt, since),
            isNull(books.deletedAt),
            gt(books.id, lastUpsertId)
          )
        )
        .limit(BATCH_SIZE)
        .orderBy(books.id);
    } catch (err) {
      console.error('Database error during incremental sync upsert fetching:', err);
      failed = true;
      break;
    }

    if (updatedBooks.length === 0) {
      hasMoreUpserts = false;
      break;
    }

    lastUpsertId = updatedBooks[updatedBooks.length - 1].id;
    const documents = updatedBooks.map(mapBookToTypesense);

    try {
      await typesenseClient.collections(BOOKS_COLLECTION_NAME).documents().import(documents, { action: 'upsert' });
      totalUpserted += documents.length;
    } catch (err) {
      console.error('Error upserting documents in incremental sync', err);
      failed = true;
      break;
    }
  }

  if (totalUpserted > 0) {
    console.log(`Incremental sync: Upserted ${totalUpserted} books.`);
  }

  // 2. Process soft-deleted books in batches
  let lastDeleteId = 0;
  let hasMoreDeletes = true;
  let totalDeleted = 0;

  while (hasMoreDeletes) {
    let deletedBooks: Book[];
    try {
      deletedBooks = await db.select()
        .from(books)
        .where(
          and(
            gt(books.deletedAt, since),
            isNotNull(books.deletedAt),
            gt(books.id, lastDeleteId)
          )
        )
        .limit(BATCH_SIZE)
        .orderBy(books.id);
    } catch (err) {
      console.error('Database error during incremental sync delete fetching:', err);
      failed = true;
      break;
    }

    if (deletedBooks.length === 0) {
      hasMoreDeletes = false;
      break;
    }

    lastDeleteId = deletedBooks[deletedBooks.length - 1].id;
    const ids = deletedBooks.map(b => b.id.toString());

    try {
      await typesenseClient.collections(BOOKS_COLLECTION_NAME).documents().delete({
        filter_by: `id:=[${ids.join(',')}]`
      });
      totalDeleted += deletedBooks.length;
    } catch (err) {
      console.error('Error deleting documents in incremental sync', err);
      failed = true;
      break;
    }
  }

  if (totalDeleted > 0) {
    console.log(`Incremental sync: Deleted ${totalDeleted} books from Typesense.`);
  }

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
      await runFullSync();
    } else {
      // Typesense has data. Catch up from epoch so records that changed while
      // the server was down are backfilled. Seeding from MAX(updatedAt) would
      // make the incremental query match zero rows by construction.
      lastSyncTime = new Date(0);
      await runIncrementalSync();
    }
  } catch (error) {
    console.error('Error during startup sync:', error);
  }
}
