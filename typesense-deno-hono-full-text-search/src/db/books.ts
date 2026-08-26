import { sql } from '../config/database.ts';

export interface Book {
  id: number;
  title: string;
  authors: string[];
  publication_year: number | null;
  average_rating: string | null;
  image_url: string | null;
  ratings_count: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface BookInput {
  title?: string;
  authors?: string[];
  publication_year?: number | null;
  average_rating?: number | null;
  image_url?: string | null;
  ratings_count?: number;
}

export async function dbNow(): Promise<Date> {
  const [row] = await sql<{ now: Date }[]>`SELECT now() AS now`;
  return row.now;
}

export async function countActiveBooks(): Promise<number> {
  const [row] = await sql<{ total: string }[]>`
    SELECT count(*)::text AS total FROM books WHERE deleted_at IS NULL`;
  return Number(row.total);
}

export async function listActiveBooks(limit: number, offset: number): Promise<Book[]> {
  return await sql<Book[]>`
    SELECT * FROM books
    WHERE deleted_at IS NULL
    ORDER BY id
    LIMIT ${limit} OFFSET ${offset}`;
}

export async function findActiveBookById(id: number): Promise<Book | undefined> {
  const [row] = await sql<Book[]>`
    SELECT * FROM books WHERE id = ${id} AND deleted_at IS NULL`;
  return row;
}

export async function insertBook(input: BookInput): Promise<Book> {
  const [row] = await sql<Book[]>`
    INSERT INTO books (title, authors, publication_year, average_rating, image_url, ratings_count)
    VALUES (
      ${input.title ?? ''},
      ${input.authors ?? []},
      ${input.publication_year ?? null},
      ${input.average_rating ?? null},
      ${input.image_url ?? null},
      ${input.ratings_count ?? 0}
    )
    RETURNING *`;
  return row;
}

export async function updateBook(id: number, input: BookInput): Promise<Book | undefined> {
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.authors !== undefined) patch.authors = input.authors;
  if (input.publication_year !== undefined) patch.publication_year = input.publication_year;
  if (input.average_rating !== undefined) patch.average_rating = input.average_rating;
  if (input.image_url !== undefined) patch.image_url = input.image_url;
  if (input.ratings_count !== undefined) patch.ratings_count = input.ratings_count;

  if (Object.keys(patch).length === 0) return await findActiveBookById(id);

  const [row] = await sql<Book[]>`
    UPDATE books SET ${sql(patch)}
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING *`;
  return row;
}

export async function softDeleteBook(id: number): Promise<Book | undefined> {
  const [row] = await sql<Book[]>`
    UPDATE books SET deleted_at = now()
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING *`;
  return row;
}

export async function fetchActiveBooksAfterId(lastId: number, limit: number): Promise<Book[]> {
  return await sql<Book[]>`
    SELECT * FROM books
    WHERE id > ${lastId} AND deleted_at IS NULL
    ORDER BY id
    LIMIT ${limit}`;
}

export async function fetchBooksUpdatedSince(
  since: Date,
  lastId: number,
  limit: number,
): Promise<Book[]> {
  return await sql<Book[]>`
    SELECT * FROM books
    WHERE updated_at > ${since} AND deleted_at IS NULL AND id > ${lastId}
    ORDER BY id
    LIMIT ${limit}`;
}

export async function fetchBooksDeletedSince(
  since: Date,
  lastId: number,
  limit: number,
): Promise<{ id: number }[]> {
  return await sql<{ id: number }[]>`
    SELECT id FROM books
    WHERE deleted_at > ${since} AND id > ${lastId}
    ORDER BY id
    LIMIT ${limit}`;
}
