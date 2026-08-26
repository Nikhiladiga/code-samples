import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import { typesenseClient } from './client.ts';
import { env } from '../config/env.ts';

export const BOOKS_COLLECTION_NAME = env.TYPESENSE_COLLECTION;

const booksSchema: CollectionCreateSchema = {
  name: BOOKS_COLLECTION_NAME,
  fields: [
    { name: 'title', type: 'string', facet: false },
    { name: 'authors', type: 'string[]', facet: true },
    { name: 'publication_year', type: 'int32', facet: true },
    { name: 'average_rating', type: 'float', facet: true },
    { name: 'image_url', type: 'string', facet: false, index: false, optional: true },
    { name: 'ratings_count', type: 'int32', facet: true },
  ],
  default_sorting_field: 'ratings_count',
};

export async function initializeTypesense(): Promise<void> {
  try {
    await typesenseClient.collections(BOOKS_COLLECTION_NAME).retrieve();
    console.log(`Collection '${BOOKS_COLLECTION_NAME}' already exists.`);
  } catch (error) {
    if ((error as { httpStatus?: number }).httpStatus !== 404) throw error;
    console.log(`Collection '${BOOKS_COLLECTION_NAME}' not found. Creating...`);
    await typesenseClient.collections().create(booksSchema);
    console.log(`Collection '${BOOKS_COLLECTION_NAME}' created.`);
  }
}

export async function getCollectionDocumentCount(): Promise<number> {
  const collection = await typesenseClient.collections(BOOKS_COLLECTION_NAME).retrieve();
  return collection.num_documents ?? 0;
}
