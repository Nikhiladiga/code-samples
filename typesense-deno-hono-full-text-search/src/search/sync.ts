import { env } from '../config/env.ts';
import {
  type Book,
  dbNow,
  fetchActiveBooksAfterId,
  fetchBooksDeletedSince,
  fetchBooksUpdatedSince,
} from '../db/books.ts';
import { typesenseClient } from './client.ts';
import { BOOKS_COLLECTION_NAME, getCollectionDocumentCount } from './collections.ts';

export interface BookDocument {
  id: string;
  title: string;
  authors: string[];
  publication_year: number;
  average_rating: number;
  image_url: string;
  ratings_count: number;
}

export interface SyncResult {
  startedAt: Date;
  upserted: number;
  deleted: number;
  failed: boolean;
}

const BATCH_SIZE = env.SYNC_BATCH_SIZE;
const EPOCH = new Date(0);

let lastSyncTime: Date = EPOCH;

export function getLastSyncTime(): Date {
  return lastSyncTime;
}

export function mapBookToDocument(book: Book): BookDocument {
  return {
    id: String(book.id),
    title: book.title,
    authors: book.authors ?? [],
    publication_year: book.publication_year ?? 0,
    average_rating: book.average_rating === null ? 0 : Number(book.average_rating),
    image_url: book.image_url ?? '',
    ratings_count: book.ratings_count ?? 0,
  };
}

export async function upsertBookDocument(book: Book): Promise<void> {
  await typesenseClient
    .collections<BookDocument>(BOOKS_COLLECTION_NAME)
    .documents()
    .upsert(mapBookToDocument(book));
}

export async function deleteBookDocument(id: number): Promise<void> {
  try {
    await typesenseClient.collections(BOOKS_COLLECTION_NAME).documents(String(id)).delete();
  } catch (error) {
    if ((error as { httpStatus?: number }).httpStatus === 404) return;
    throw error;
  }
}

async function importBatch(documents: BookDocument[]): Promise<number> {
  const results = await typesenseClient
    .collections<BookDocument>(BOOKS_COLLECTION_NAME)
    .documents()
    .import(documents, { action: 'upsert' });

  const failures = (Array.isArray(results) ? results : []).filter((result) => !result.success);
  if (failures.length > 0) {
    for (const failure of failures.slice(0, 5)) {
      console.error(`Import rejected a document: ${failure.error}`);
    }
    throw new Error(`${failures.length} of ${documents.length} documents failed to import`);
  }
  return documents.length;
}

export async function runFullSync(): Promise<SyncResult> {
  const startedAt = await dbNow();
  console.log(`Full sync started, stamped ${startedAt.toISOString()}`);

  let lastId = 0;
  let upserted = 0;
  let failed = false;

  while (true) {
    let batch: Book[];
    try {
      batch = await fetchActiveBooksAfterId(lastId, BATCH_SIZE);
    } catch (error) {
      console.error('Full sync: database read failed:', error);
      failed = true;
      break;
    }

    if (batch.length === 0) break;
    lastId = batch[batch.length - 1].id;

    try {
      upserted += await importBatch(batch.map(mapBookToDocument));
      console.log(`Full sync: ${upserted} books indexed so far.`);
    } catch (error) {
      console.error('Full sync: Typesense import failed:', error);
      failed = true;
      break;
    }
  }

  if (failed) {
    console.warn(
      `Full sync incomplete after ${upserted} books; last sync time stays at ${lastSyncTime.toISOString()}`,
    );
  } else {
    lastSyncTime = startedAt;
    console.log(`Full sync completed: ${upserted} books indexed.`);
  }

  return { startedAt, upserted, deleted: 0, failed };
}

export async function runIncrementalSync(): Promise<SyncResult> {
  const startedAt = await dbNow();
  const since = lastSyncTime;
  console.log(`Incremental sync started for changes after ${since.toISOString()}`);

  let upserted = 0;
  let deleted = 0;
  let failed = false;

  let lastUpsertId = 0;
  while (!failed) {
    let batch: Book[];
    try {
      batch = await fetchBooksUpdatedSince(since, lastUpsertId, BATCH_SIZE);
    } catch (error) {
      console.error('Incremental sync: database read failed during upsert phase:', error);
      failed = true;
      break;
    }

    if (batch.length === 0) break;
    lastUpsertId = batch[batch.length - 1].id;

    try {
      upserted += await importBatch(batch.map(mapBookToDocument));
    } catch (error) {
      console.error('Incremental sync: Typesense import failed:', error);
      failed = true;
      break;
    }
  }

  let lastDeleteId = 0;
  while (!failed) {
    let batch: { id: number }[];
    try {
      batch = await fetchBooksDeletedSince(since, lastDeleteId, BATCH_SIZE);
    } catch (error) {
      console.error('Incremental sync: database read failed during delete phase:', error);
      failed = true;
      break;
    }

    if (batch.length === 0) break;
    lastDeleteId = batch[batch.length - 1].id;

    for (const row of batch) {
      try {
        await deleteBookDocument(row.id);
        deleted++;
      } catch (error) {
        console.error(`Incremental sync: failed to delete document ${row.id}:`, error);
        failed = true;
        break;
      }
    }
  }

  if (failed) {
    console.warn(
      `Incremental sync incomplete; last sync time stays at ${lastSyncTime.toISOString()} so the next run retries it`,
    );
  } else {
    lastSyncTime = startedAt;
    if (upserted || deleted) {
      console.log(`Incremental sync completed: ${upserted} upserted, ${deleted} deleted.`);
    } else {
      console.log('Incremental sync completed: no changes.');
    }
  }

  return { startedAt, upserted, deleted, failed };
}

export async function determineAndRunStartupSync(): Promise<void> {
  const documentCount = await getCollectionDocumentCount();

  if (documentCount === 0) {
    console.log('Typesense collection is empty — running a full sync.');
    await runFullSync();
    return;
  }

  console.log(`Typesense collection holds ${documentCount} documents — catching up from epoch.`);
  lastSyncTime = EPOCH;
  await runIncrementalSync();
}
