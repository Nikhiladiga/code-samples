import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import { typesenseClient } from './client';

export const BOOKS_COLLECTION_NAME = 'books';

export const booksCollectionSchema: CollectionCreateSchema = {
  name: BOOKS_COLLECTION_NAME,
  fields: [
    { name: 'id', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'authors', type: 'string[]', facet: true },
    { name: 'publication_year', type: 'int32', facet: true, optional: true },
    { name: 'average_rating', type: 'float', facet: true, optional: true },
    { name: 'image_url', type: 'string', optional: true },
    { name: 'ratings_count', type: 'int32', optional: true },
  ],
};

export async function initializeTypesense(): Promise<void> {
  try {
    const collections = await typesenseClient.collections().retrieve();
    const collectionExists = collections.some((c) => c.name === BOOKS_COLLECTION_NAME);

    if (!collectionExists) {
      console.log(`Creating collection ${BOOKS_COLLECTION_NAME}...`);
      await typesenseClient.collections().create(booksCollectionSchema);
      console.log(`Collection ${BOOKS_COLLECTION_NAME} created successfully.`);
    } else {
      console.log(`Collection ${BOOKS_COLLECTION_NAME} already exists.`);
    }
  } catch (error) {
    console.error('Error initializing Typesense collection:', error);
    throw error;
  }
}
