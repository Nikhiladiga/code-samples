# Node.js Express Full-Text Search with Typesense

A production-ready RESTful search API built with Node.js, Express, PostgreSQL (Sequelize), and Typesense. Features full-text search, CRUD operations, real-time async indexing, and background sync workers.

## Tech Stack

- Node.js
- Express
- PostgreSQL with Sequelize
- Typesense
- TypeScript
- Docker

## Prerequisites

- Node.js v18+ installed
- Docker (for Typesense and PostgreSQL)
- Basic knowledge of REST APIs and SQL

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/typesense/code-samples.git
cd typesense-node-sequelize-search-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start Typesense and PostgreSQL

Run Typesense and PostgreSQL using Docker:

```bash
# Start Typesense (replace TYPESENSE_VERSION with the latest from https://typesense.org/docs/guide/install-typesense.html)
docker run -d \
  -p 8108:8108 \
  -v typesense-data:/data \
  typesense/typesense:27.1 \
  --data-dir /data \
  --api-key=xyz \
  --enable-cors

# Start PostgreSQL
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=typesense_books \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:15
```

### 4. Set up environment variables

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

### 5. Project Structure

```text
├── src/
│   ├── config/
│   │   ├── database.ts      # Sequelize configuration
│   │   └── env.ts           # Environment variable validation
│   ├── models/
│   │   └── Book.ts          # Sequelize Book model
│   ├── routes/
│   │   ├── books.ts         # CRUD endpoints for books
│   │   └── search.ts        # Search and sync endpoints
│   ├── search/
│   │   ├── client.ts        # Typesense client initialization
│   │   ├── collections.ts   # Typesense collection schema
│   │   ├── sync.ts          # Sync logic (incremental, full, soft delete)
│   │   └── worker.ts        # Background sync worker
│   └── server.ts            # Main application entry point
├── package.json
├── tsconfig.json
└── .env
```

### 6. Start the development server

```bash
npm run dev
```

The server will automatically restart when you make changes to any TypeScript file.

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. API Endpoints

#### Search

```bash
GET /search?q=<query>
```

Example:

```bash
curl "http://localhost:3000/search?q=harry"
```

#### CRUD Operations

**Create a book:**

```bash
POST /books
Content-Type: application/json

{
  "title": "The Go Programming Language",
  "authors": ["Alan Donovan", "Brian Kernighan"],
  "publication_year": 2015,
  "average_rating": 4.5,
  "image_url": "https://example.com/image.jpg",
  "ratings_count": 1000
}
```

**Get a book:**

```bash
GET /books/:id
```

**Get all books (with pagination):**

```bash
GET /books?page=1&limit=10
```

**Update a book:**

```bash
PUT /books/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "authors": ["Author Name"],
  "publication_year": 2024,
  "average_rating": 4.8,
  "image_url": "https://example.com/updated.jpg",
  "ratings_count": 1500
}
```

**Delete a book (soft delete):**

```bash
DELETE /books/:id
```

#### Sync Operations

**Trigger manual sync:**

```bash
POST /sync
```

**Check sync status:**

```bash
GET /sync/status
```

### 8. How It Works

#### Architecture

```plaintext
User Request
    ↓
Express API (CRUD)
    ↓
PostgreSQL (Source of Truth)
    ↓
Async Sync → Typesense (Search Index)
    ↑
Background Worker (Every 60s)
```

#### Sync Strategies

##### 1. Startup Sync (Smart)

On every server start, the sync worker checks whether the Typesense collection already has documents. If empty, it seeds `lastSyncTime` to zero and runs a full sync. If it has data, it runs an incremental sync since `MAX(updated_at)` of PostgreSQL books table.

##### 2. Real-time Sync (Async)

Triggered on Create, Update, Delete operations in the background.

##### 3. Background Periodic Sync

Runs every 60 seconds automatically, doing incremental sync.

##### 4. Manual Sync

Endpoint: `POST /sync`
