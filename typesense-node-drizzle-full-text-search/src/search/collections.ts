import { typesenseClient } from './client';
import { env } from '../config/env';
import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';

export const BOOKS_COLLECTION_NAME = env.TYPESENSE_COLLECTION;

export async function initializeTypesense() {
  const schema: CollectionCreateSchema = {
    name: BOOKS_COLLECTION_NAME,
    fields: [
      { name: 'title', type: 'string', facet: false },
      { name: 'authors', type: 'string[]', facet: true },
      { name: 'publication_year', type: 'int32', facet: true },
      { name: 'average_rating', type: 'float', facet: true },
      { name: 'image_url', type: 'string', facet: false },
      { name: 'ratings_count', type: 'int32', facet: true },
    ],
    default_sorting_field: 'ratings_count',
  };

  try {
    await typesenseClient.collections(BOOKS_COLLECTION_NAME).retrieve();
    console.log(`Collection '${BOOKS_COLLECTION_NAME}' already exists.`);
  } catch (error: any) {
    if (error.httpStatus === 404) {
      console.log(`Collection '${BOOKS_COLLECTION_NAME}' not found. Creating...`);
      await typesenseClient.collections().create(schema);
      console.log(`Collection '${BOOKS_COLLECTION_NAME}' created successfully.`);
    } else {
      throw error;
    }
  }
}
