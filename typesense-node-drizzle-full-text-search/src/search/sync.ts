import { db } from '../config/database';
import { books, type Book } from '../db/schema';
import { typesenseClient } from './client';
import { BOOKS_COLLECTION_NAME } from './collections';
import { eq, gt, isNull, and, isNotNull, desc } from 'drizzle-orm';

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
  let lastId = 0;
  let hasMore = true;
  let totalProcessed = 0;

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
      break; 
    }
  }

  lastSyncTime = new Date();
  console.log('Full sync completed.');
}

export async function runIncrementalSync() {
  console.log(`Running incremental sync since ${lastSyncTime.toISOString()}...`);
  
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
            gt(books.updatedAt, lastSyncTime),
            isNull(books.deletedAt),
            gt(books.id, lastUpsertId)
          )
        )
        .limit(BATCH_SIZE)
        .orderBy(books.id);
    } catch (err) {
      console.error('Database error during incremental sync upsert fetching:', err);
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
            gt(books.updatedAt, lastSyncTime),
            isNotNull(books.deletedAt),
            gt(books.id, lastDeleteId)
          )
        )
        .limit(BATCH_SIZE)
        .orderBy(books.id);
    } catch (err) {
      console.error('Database error during incremental sync delete fetching:', err);
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
      break;
    }
  }

  if (totalDeleted > 0) {
    console.log(`Incremental sync: Deleted ${totalDeleted} books from Typesense.`);
  }

  lastSyncTime = new Date();
  console.log('Incremental sync completed.');
}

export async function determineAndRunStartupSync() {
  try {
    const searchStats = await typesenseClient.collections(BOOKS_COLLECTION_NAME).retrieve();
    const docCount = searchStats.num_documents;

    if (docCount === 0) {
      await runFullSync();
    } else {
      const latestBook = await db.select()
        .from(books)
        .orderBy(desc(books.updatedAt))
        .limit(1);

      if (latestBook.length > 0 && latestBook[0].updatedAt) {
        lastSyncTime = latestBook[0].updatedAt;
      }
      
      await runIncrementalSync();
    }
  } catch (error) {
    console.error('Error during startup sync:', error);
  }
}
