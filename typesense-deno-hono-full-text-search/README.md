# Typesense Deno + Hono Full-Text Search App

A production-ready RESTful search API built with Deno, Hono, PostgreSQL, and Typesense.

This application maintains PostgreSQL as the primary source of truth while keeping Typesense synchronously and asynchronously updated to handle fast, typo-tolerant full-text searches.

## Features
- **Deno Native**: No bundler and no build step. Dependencies are declared in `deno.json`.
- **Plain SQL**: Queries are hand-written with [postgres.js](https://github.com/porsager/postgres). No ORM and no migration tool.
- **Batched Incremental Sync**: Handles millions of rows without memory bloat using keyset pagination.
- **Soft Delete Support**: Properly handles `deleted_at` fields and purges ghosts from Typesense.
- **Background Worker**: Keeps the database and Typesense index synchronized automatically.

## Prerequisites
- Deno v2+
- Docker

## Setup & Running

1. **Start Typesense and PostgreSQL:**
```bash
docker run -d -p 8108:8108 \
  -v "$(pwd)"/typesense-data:/data \
  typesense/typesense:30.2 \
  --data-dir /data \
  --api-key=xyz \
  --enable-cors

docker run -d \
  --name local_postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_DB=typesense_books \
  -p 5432:5432 \
  postgres:16
```

If PostgreSQL is already running locally on port `5432`, map the container to a free port instead (for example `-p 5433:5432`) and update `DATABASE_URL` to match.

2. **Set up environment variables:**
Copy the template and fill in your PostgreSQL and Typesense values.
```bash
cp .env.example .env
```

3. **Create the database schema:**
Apply `db/schema.sql`, which creates the `books` table, its indexes, the `updated_at` trigger, and a few seed books.
```bash
deno task db:migrate
```

4. **Start the application:**
```bash
deno task dev
```

The app will connect to PostgreSQL, initialize the Typesense collection, perform a startup sync (if needed), start the background sync worker, and bind to `http://localhost:3000`.
