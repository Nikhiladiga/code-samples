# Typesense Node.js Drizzle ORM Full-Text Search App

A production-ready RESTful search API built with Node.js, Express, Drizzle ORM, PostgreSQL, and Typesense.

This application maintains PostgreSQL as the primary source of truth while keeping Typesense synchronously and asynchronously updated to handle fast, typo-tolerant full-text searches.

## Features
- **Drizzle ORM Integration**: High performance, strongly-typed PostgreSQL queries.
- **Batched Incremental Sync**: Handles millions of rows without memory bloat using cursor-based pagination.
- **Soft Delete Support**: Properly handles `deleted_at` fields and purges ghosts from Typesense.
- **Cron Jobs**: Background worker keeps the database and Typesense index synchronized automatically.

## Prerequisites
- Node.js v18+
- Docker

## Setup & Running

1. **Start Typesense and PostgreSQL:**
```bash
docker run -d -p 8108:8108 \
  -v "$(pwd)"/typesense-data:/data \
  typesense/typesense:27.1 \
  --data-dir /data \
  --api-key=xyz \
  --enable-cors

docker run -d \
  --name local_postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_DB=testdb \
  -p 5432:5432 \
  postgres:16
```

2. **Install dependencies:**
```bash
npm install
```

3. **Generate and Run Migrations:**
Generate Drizzle migrations from `src/db/schema.ts` and push them to the database.
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

4. **Start the application:**
```bash
npm run dev
```

The app will connect to PostgreSQL, initialize Typesense schemas, perform a startup sync (if needed), start the cron worker, and bind to `http://localhost:3002`.
