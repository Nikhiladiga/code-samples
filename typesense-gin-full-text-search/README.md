# Gin Full-Text Search with Typesense

A production-ready RESTful search API built with Go Gin framework, PostgreSQL, and Typesense. Features full-text search, CRUD operations, real-time async indexing, and background sync workers.

## Tech Stack

- Go 1.19+
- Gin Web Framework
- PostgreSQL with GORM
- Typesense
- Docker

## Prerequisites

- Go 1.19+ installed
- Docker (for Typesense and PostgreSQL)
- Basic knowledge of Go, REST APIs, and SQL

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/typesense/code-samples.git
cd typesense-gin-full-text-search
```

### 2. Install dependencies

```bash
go mod download
```

### 3. Start Typesense and PostgreSQL

Run Typesense and PostgreSQL using Docker:

```bash
# Start Typesense (replace TYPESENSE_VERSION with the latest from https://typesense.org/docs/guide/install-typesense.html)
docker run -d \
  -p 8108:8108 \
  -v typesense-data:/data \
  typesense/typesense:TYPESENSE_VERSION \
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

Create a `.env` file in the project root:

```env
# Server Configuration
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=typesense_books
DB_PORT=5432

# Typesense Configuration
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=xyz
```

### 5. Project Structure

```text
├── config/
│   └── config.go            # Environment variable helpers and config (BookCollection, GetEnv, GetServerURL)
├── models/
│   └── book.go              # Book model with GORM tags
├── routes/
│   ├── books.go             # CRUD endpoints for books
│   └── search.go            # Search and sync endpoints
├── search/
│   ├── client.go            # Typesense client initialization
│   ├── collections.go       # Typesense collection schema and document count
│   ├── sync.go              # Sync logic (incremental, full, soft delete) and sync state
│   └── worker.go            # Background sync worker and real-time sync helpers
├── store/
│   └── store.go             # PostgreSQL database operations via GORM
├── server.go                # Main application entry point
├── go.mod
└── .env
```

### 6. Start the development server

**Standard mode:**

```bash
go run server.go
```

**Hot reload mode (recommended for development):**

First, install CompileDaemon:

```bash
go install github.com/githubnemo/CompileDaemon@latest
```

Then run:

```bash
CompileDaemon --build="go build -o server ." --command="./server"
```

The server will automatically restart when you make changes to any Go file.

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

Response:

```json
{
  "query": "harry",
  "found": 7,
  "results": [...],
  "facet_counts": [...]
}
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

**Get all books:**

```bash
GET /books
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

Response:

```json
{
  "message": "Sync completed",
  "newSyncTime": "2026-02-25T07:54:11+05:30",
  "syncedAt": "2026-02-25T07:54:11+05:30",
  "deletedBooks": 1
}
```

**Check sync status:**

```bash
GET /sync/status
```

Response:

```json
{
  "lastSyncTime": "2026-02-25T07:54:11+05:30",
  "syncWorkerRunning": true
}
```

### 8. How It Works

#### Architecture

```plaintext
User Request
    ↓
Gin API (CRUD)
    ↓
PostgreSQL (Source of Truth)
    ↓
Async Sync → Typesense (Search Index)
    ↑
Background Worker (Every 60s)
```

#### Sync Strategies

##### 1. Startup Sync (Smart)

On every server start, the sync worker checks whether the Typesense collection already has documents:

- **Typesense is empty** (first run or fresh instance): Seeds `lastSyncTime` to zero and runs a full sync — all records from PostgreSQL are pushed to Typesense.
- **Typesense already has data** (restart): Seeds `lastSyncTime` from `MAX(updated_at)` of the PostgreSQL books table, then runs an incremental sync — only records changed since that timestamp are synced. This avoids re-syncing thousands of already-indexed records on every restart.

##### 2. Real-time Sync (Async)

- Triggered on: Create, Update, Delete operations
- Non-blocking: API responds immediately
- Runs in background goroutine
- If fails: Background worker catches it within 60 seconds

##### 3. Background Periodic Sync

- Runs every 60 seconds automatically
- Incremental: Only syncs books with `updated_at > lastSyncTime`
- Handles soft deletes: Removes deleted books from Typesense
- Efficient: Uses upsert to handle both inserts and updates

##### 4. Manual Sync

- Endpoint: `POST /sync`
- On-demand sync trigger
- Useful for debugging or forced sync

#### Pagination for Large Datasets

**The sync implementation uses pagination to handle large datasets efficiently:**

- **Database Pagination**: Fetches 1,000 records per query (configurable via `PageSize`)
- **Batch Import**: Imports 1,000 documents per Typesense API call (configurable via `BatchSize`)
- **Memory Efficient**: Processes data in chunks to avoid loading entire dataset into memory
- **Progress Tracking**: Logs progress for each page/batch processed

**Configuration** (in `search/sync.go`):

```go
type SyncConfig struct {
    BatchSize: 1000,  // Typesense import batch size
    PageSize:  1000,  // Database pagination size
}
```

**Benefits**:

- ✅ Handles millions of records without memory issues
- ✅ Predictable memory usage regardless of dataset size
- ✅ Detailed progress logging for monitoring
- ✅ Automatic retry handling by Typesense Go client (3 retries with 1s interval)

**Example Log Output** (for 5,500 records):

```plaintext
Total books to sync: 5500 (processing in batches of 1000)
Will process 6 pages
Processing page 1/6...
Fetched 1000 books from page 1
Page 1/6 completed: 1000 succeeded, 0 failed (Total so far: 1000 succeeded, 0 failed)
Processing page 2/6...
...
Page 6/6 completed: 500 succeeded, 0 failed (Total so far: 5500 succeeded, 0 failed)
Full sync completed: 5500 documents upserted, 0 failed out of 5500 total
```

#### Database Schema

```sql
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    authors JSONB,                    -- Array stored as JSON
    publication_year INTEGER,
    average_rating DECIMAL,
    image_url VARCHAR(255),
    ratings_count INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP              -- Soft delete support
);
```

#### Typesense Collection Schema

```go
{
    "name": "books",
    "fields": [
        {"name": "id", "type": "string"},
        {"name": "title", "type": "string"},
        {"name": "authors", "type": "string[]", "facet": true},
        {"name": "publication_year", "type": "int32", "facet": true},
        {"name": "average_rating", "type": "float", "facet": true},
        {"name": "image_url", "type": "string"},
        {"name": "ratings_count", "type": "int32"}
    ]
}
```

### 9. Deployment

**Environment Variables for Production:**

```env
# Server Configuration
PORT=3000
GIN_MODE=release

# Database Configuration (use managed PostgreSQL)
DB_HOST=your-postgres-host.com
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=typesense_books
DB_PORT=5432

# Typesense Configuration (use Typesense Cloud)
TYPESENSE_HOST=xxx.typesense.net
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=your-production-api-key
```

### 10. Testing the Sync

**Test real-time sync:**

```bash
# 1. Create a book via API
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Book", "authors": ["Author"], "publication_year": 2024}'

# 2. Search immediately (should appear)
curl "http://localhost:3000/search?q=Test"
```

**Test background sync:**

```bash
# 1. Insert book directly in database (bypassing API)
psql -h localhost -U postgres -d typesense_books -c "
INSERT INTO books (title, authors, publication_year, created_at, updated_at)
VALUES ('Direct DB Book', '[\"DB Author\"]', 2025, NOW(), NOW());
"

# 2. Wait 60 seconds for background worker

# 3. Search (should appear after sync)
curl "http://localhost:3000/search?q=Direct"
```

**Test soft delete sync:**

```bash
# 1. Soft delete a book in database
psql -h localhost -U postgres -d typesense_books -c "
UPDATE books SET deleted_at = NOW(), updated_at = NOW() WHERE id = 1;
"

# 2. Trigger manual sync or wait 60 seconds
curl -X POST http://localhost:3000/sync

# 3. Search (should not appear)
curl "http://localhost:3000/search?q=<book-title>"
```
