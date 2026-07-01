import { pgTable, serial, varchar, json, integer, decimal, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  authors: json('authors').default('[]').notNull(),
  publicationYear: integer('publication_year'),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
  imageUrl: varchar('image_url', { length: 255 }),
  ratingsCount: integer('ratings_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`).notNull(),
  deletedAt: timestamp('deleted_at'),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
