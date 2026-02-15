# Gin Full-Text Search with Typesense

A RESTful search API built with Go Gin framework and Typesense, featuring full-text search capabilities with environment-based configuration.

## Tech Stack

- Go 1.19+
- Gin Web Framework
- Typesense

## Prerequisites

- Go 1.19+ installed
- Docker (for running Typesense locally). Alternatively, you can use a Typesense Cloud cluster.
- Basic knowledge of Go and REST APIs.

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

### 3. Set up environment variables

Create a `.env` file in the project root with the following content:

```env
# Server Configuration
PORT=3000

# Typesense Configuration
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=xyz
TYPESENSE_COLLECTION=books
```

### 4. Project Structure

```text
├── routes
│   └── search.go
├── utils
│   ├── env.go
│   └── typesense.go
├── server.go
├── go.mod
└── .env
```

### 5. Start the development server

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

### 6. Search API Endpoint

**Search:**

```bash
GET /search?q=<query>
```

Example:

```bash
curl "http://localhost:3000/search?q=harry"
```

### 7. Deployment

Set env variables to point the app to the Typesense Cluster:

```env
# Server Configuration
PORT=3000

# Typesense Configuration
TYPESENSE_HOST=xxx.typesense.net
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=your-production-api-key
TYPESENSE_COLLECTION=books
```

- Configure CORS middleware for specific origins.
- Configure gin to run in release mode.
- Add some sort of authentication to the API.
- Add rate limiting to the API.
