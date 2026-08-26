CREATE TABLE IF NOT EXISTS books (
  id               SERIAL PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  authors          TEXT[]       NOT NULL DEFAULT '{}',
  publication_year INTEGER,
  average_rating   NUMERIC(3, 2),
  image_url        VARCHAR(512),
  ratings_count    INTEGER      NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS books_updated_at_idx ON books (updated_at);
CREATE INDEX IF NOT EXISTS books_deleted_at_idx ON books (deleted_at);
CREATE INDEX IF NOT EXISTS books_active_id_idx  ON books (id) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION books_touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS books_touch_updated_at ON books;
CREATE TRIGGER books_touch_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION books_touch_updated_at();

INSERT INTO books (title, authors, publication_year, average_rating, image_url, ratings_count)
SELECT * FROM (
  VALUES
    ('Harry Potter and the Philosopher''s Stone', ARRAY['J.K. Rowling'], 1997, 4.47, 'https://covers.openlibrary.org/b/id/10521270-L.jpg', 9278000),
    ('The Hobbit', ARRAY['J.R.R. Tolkien'], 1937, 4.28, 'https://covers.openlibrary.org/b/id/6979861-L.jpg', 3400000),
    ('Dune', ARRAY['Frank Herbert'], 1965, 4.25, 'https://covers.openlibrary.org/b/id/11481354-L.jpg', 1100000),
    ('Good Omens', ARRAY['Terry Pratchett', 'Neil Gaiman'], 1990, 4.26, 'https://covers.openlibrary.org/b/id/8231990-L.jpg', 600000),
    ('The Left Hand of Darkness', ARRAY['Ursula K. Le Guin'], 1969, 4.07, 'https://covers.openlibrary.org/b/id/8231856-L.jpg', 180000)
) AS seed (title, authors, publication_year, average_rating, image_url, ratings_count)
WHERE NOT EXISTS (SELECT 1 FROM books);
