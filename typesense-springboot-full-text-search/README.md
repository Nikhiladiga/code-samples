# Spring Boot Full-Text Search with Typesense

A production-ready RESTful search API built with Spring Boot, PostgreSQL, and Typesense. Features full-text search, CRUD operations, real-time async indexing, and scheduled background sync.

## Tech Stack

- Java 17+
- Spring Boot 4.x
- PostgreSQL with Spring Data JPA
- Typesense
- Docker

## Prerequisites

- Java 17+ installed
- Maven 3.9+
- Docker (for Typesense and PostgreSQL)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/typesense/code-samples.git
cd typesense-springboot-full-text-search
```

### 2. Start Typesense and PostgreSQL

```bash
# Start Typesense
docker run -d \
  -p 8108:8108 \
  -v typesense-data:/data \
  typesense/typesense:latest \
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

### 3. Set up environment variables

Copy the example file and adjust as needed:

```bash
cp .env.example .env
```

Or export the variables directly:

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=password
export DB_NAME=typesense_books
export TYPESENSE_HOST=localhost
export TYPESENSE_PORT=8108
export TYPESENSE_PROTOCOL=http
export TYPESENSE_API_KEY=xyz
```

### 4. Project Structure

```text
src/main/java/org/typesense/full_text_search/
├── FullTextSearchApplication.java       # Entry point (@EnableScheduling, @EnableAsync)
├── config/
│   ├── TypesenseConfig.java             # Typesense client bean
│   └── AsyncConfig.java                 # Thread pool for async Typesense operations
├── model/
│   └── Book.java                        # JPA entity with soft delete support
├── repository/
│   └── BookRepository.java              # Spring Data JPA repository
├── service/
│   ├── BookService.java                 # Book CRUD operations
│   └── TypesenseService.java            # Typesense search, sync, collection management
├── scheduler/
│   └── TypesenseSyncScheduler.java      # @Scheduled periodic sync worker
└── controller/
    ├── BookController.java              # CRUD endpoints for books
    ├── SearchController.java            # Search endpoint
    └── SyncController.java             # Manual sync + status endpoints
```

### 5. Start the development server

```bash
./mvnw spring-boot:run
```

Open [http://localhost:4000](http://localhost:4000).

### 6. API Endpoints

#### Search

```bash
GET /search?q=<query>
```

Example:

```bash
curl "http://localhost:4000/search?q=harry"
```

#### CRUD Operations

**Create a book:**

```bash
curl -X POST http://localhost:4000/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Go Programming Language",
    "authors": ["Alan Donovan", "Brian Kernighan"],
    "publicationYear": 2015,
    "averageRating": 4.5,
    "imageUrl": "https://example.com/image.jpg",
    "ratingsCount": 1000
  }'
```

**Get a book:**

```bash
GET /books/:id
```

**Get all books (paginated):**

```bash
GET /books?page=1&page_size=100
```

**Update a book:**

```bash
PUT /books/:id
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

### 7. How It Works

#### Architecture

```plaintext
User Request
    ↓
Spring Boot API (CRUD)
    ↓
PostgreSQL (Source of Truth)
    ↓
Async Sync → Typesense (Search Index)
    ↑
@Scheduled Worker (Every 60s)
```

#### Sync Strategies

##### 1. Startup Sync (Smart)

On application startup (`ApplicationReadyEvent`), the scheduler checks whether the Typesense collection already has documents:

- **Typesense is empty**: Seeds `lastSyncTime` to epoch and runs a full sync.
- **Typesense already has data**: Seeds `lastSyncTime` from `MAX(updated_at)` of the books table, then runs an incremental sync.

##### 2. Real-time Sync (Async)

- Triggered on: Create, Update, Delete operations
- Non-blocking: API responds immediately
- Runs in a dedicated thread pool (`typesenseAsyncExecutor`)
- If it fails, the background worker catches it within 60 seconds

##### 3. Background Periodic Sync (`@Scheduled`)

- Runs every 60 seconds (configurable via `typesense.sync.interval-ms`)
- Incremental: Only syncs books with `updated_at > lastSyncTime`
- Handles soft deletes: Removes deleted books from Typesense
- Uses upsert for both inserts and updates

##### 4. Manual Sync

- Endpoint: `POST /sync`
- On-demand sync trigger

#### Configuration

All sync parameters are configurable in `application.properties`:

```properties
typesense.sync.interval-ms=60000
typesense.sync.batch-size=1000
typesense.sync.page-size=1000
typesense.sync.enable-soft-delete=true
```

### 8. Deployment

**Environment Variables for Production:**

```env
DB_HOST=your-postgres-host.com
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=typesense_books
DB_PORT=5432
TYPESENSE_HOST=xxx.typesense.net
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=your-production-api-key
```
