# Django Full-Text Search with Typesense

A production-ready RESTful search API built with Python, Django, PostgreSQL, and Typesense. Features full-text search, CRUD operations, real-time async indexing, soft deletes, paginated sync, and background workers.

## Tech Stack

- Python 3.10+
- Django 5.0+
- PostgreSQL (`psycopg2-binary`)
- Typesense (`typesense-python`)
- APScheduler (background periodic sync)
- Docker

## Prerequisites

- Python 3.10+ installed
- Docker (for Typesense and PostgreSQL)
- Basic knowledge of Python, Django, REST APIs, and SQL

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/typesense/code-samples.git
cd typesense-django-full-text-search
```

### 2. Set up virtual environment & install dependencies

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Start Typesense and PostgreSQL

Run Typesense and PostgreSQL using Docker:

```bash
# Create local data directory for Typesense
mkdir -p typesense-data

# Start Typesense
docker run -d \
  -p 8108:8108 \
  -v "$(pwd)"/typesense-data:/data \
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
  postgres:15
```

### 4. Set up environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

The `.env` file should look like this:

```env
PORT=8000

# PostgreSQL Configuration
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

# Django Configuration
DJANGO_SECRET_KEY=change-me-in-production
```

### 5. Run Database Migrations

```bash
python manage.py migrate
```

### 6. Project Structure

```text
typesense-django-full-text-search/
├── books/
│   ├── search/
│   │   ├── __init__.py      # Exports search client and sync functions
│   │   ├── client.py        # Typesense Python client initialization
│   │   ├── collections.py   # Typesense collection schema definition
│   │   ├── sync.py          # Paginated full & incremental sync logic
│   │   └── worker.py        # APScheduler background periodic sync worker
│   ├── tests/
│   │   ├── test_models.py   # Tests for soft-delete & model managers
│   │   ├── test_sync.py     # Tests for document mapping & sync logic
│   │   └── test_views.py    # Tests for API endpoints & search proxy
│   ├── apps.py              # Starts background sync worker on Django startup
│   ├── models.py            # Book Django model with ActiveBookManager
│   ├── urls.py              # App routing
│   └── views.py             # CRUD & search proxy API views
├── typesensedjango/
│   ├── settings.py          # Django project settings
│   └── urls.py              # Root URL configuration
├── .env.example
├── manage.py
└── requirements.txt
```

### 7. Start the Development Server

```bash
python manage.py runserver 8000
```

The server starts at `http://localhost:8000`. Upon startup, Django automatically initializes the Typesense collection schema and launches the background periodic sync thread.

### 8. API Endpoints

#### Search

```bash
GET /search/?q=<query>
```

Example:

```bash
curl "http://localhost:8000/search/?q=harry"
```

Response:

```json
{
  "query": "harry",
  "found": 1,
  "results": [...],
  "facet_counts": []
}
```

#### CRUD Operations

**List books (Paginated):**

```bash
GET /books/?page=1&limit=10
```

**Create a book:**

```bash
POST /books/
Content-Type: application/json

{
  "title": "The Hobbit",
  "authors": ["J.R.R. Tolkien"],
  "publication_year": 1937,
  "average_rating": 4.8,
  "image_url": "https://example.com/hobbit.jpg",
  "ratings_count": 1250000
}
```

**Get a book:**

```bash
GET /books/:id/
```

**Update a book:**

```bash
PUT /books/:id/
Content-Type: application/json

{
  "title": "The Hobbit: There and Back Again",
  "average_rating": 4.9
}
```

**Delete a book (soft delete):**

```bash
DELETE /books/:id/
```

Returns `204 No Content` and soft-deletes the row in PostgreSQL while deleting the document from Typesense.

#### Sync Operations

**Trigger manual sync:**

```bash
POST /sync/
```

Response:

```json
{
  "message": "Sync completed",
  "syncedAt": "2026-07-23T16:30:00+00:00"
}
```

**Check sync status:**

```bash
GET /sync/status/
```

Response:

```json
{
  "lastSyncTime": "2026-07-23T16:30:00+00:00",
  "syncWorkerRunning": true,
  "syncJobActive": false
}
```

### 9. How It Works

#### Architecture

```plaintext
User Request
    ↓
Django REST Views (CRUD)
    ↓
PostgreSQL (Source of Truth)
    ↓
Real-Time / Periodic Sync → Typesense (Search Index)
    ↑
Background Worker (APScheduler thread running every 60s)
```

#### Sync Strategies

1. **Real-time Sync**: On every POST/PUT/DELETE API request, the change hits PostgreSQL first, and is then immediately mirrored to Typesense.
2. **Periodic Background Sync**: Runs every 60 seconds via `APScheduler` in a thread. Uses `updated_at > last_sync_time` to catch any database changes that happened outside the API or during server downtime.
3. **Startup Sync**: On boot, if Typesense is empty, a full sync runs. If Typesense has documents, an incremental sync runs starting from epoch so missing records are backfilled.
4. **Manual Sync**: `POST /sync/` triggers an on-demand full sync.

#### Memory-Safe Keyset Pagination

Both full sync and incremental sync fetch records from PostgreSQL using keyset pagination (`id__gt=last_id`) in batches of 1,000 to prevent memory allocation spikes when syncing large tables.

### 10. Running Tests

Run the complete test suite using Django's test runner:

```bash
python manage.py test books.tests
```

```text
Ran 19 tests in 0.15s

OK
```
