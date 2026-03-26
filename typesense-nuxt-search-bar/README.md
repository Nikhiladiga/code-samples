# Nuxt.js Search Bar with Typesense

A modern search bar application built with Nuxt.js and Typesense, featuring instant search capabilities.

## Tech Stack

- Nuxt.js
- Vue 3
- Typesense
- typesense-instantsearch-adapter & vue-instantsearch
- Tailwind CSS

## Prerequisites

- Node.js 18+ and npm 9+.
- Docker (for running Typesense locally). Alternatively, you can use a Typesense Cloud cluster.
- Basic knowledge of Vue and Nuxt.js.

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/typesense/code-samples.git
cd code-samples/typesense-nuxt-search-bar
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Typesense and import data

#### Start Typesense Server (Local Development)

```bash
docker run -d -p 8108:8108 \
  -v/tmp/typesense-data:/data typesense/typesense:27.1 \
  --data-dir /data --api-key=xyz --enable-cors
```

#### Create Collection and Import Data

The application expects a `books` collection with the following schema:

```json
{
  "name": "books",
  "fields": [
    {"name": "title", "type": "string"},
    {"name": "authors", "type": "string[]"},
    {"name": "publication_year", "type": "int32"},
    {"name": "average_rating", "type": "float"},
    {"name": "ratings_count", "type": "int32"},
    {"name": "image_url", "type": "string", "optional": true}
  ]
}
```

### 4. Set up environment variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Update the values in `.env`:

```env
NUXT_PUBLIC_TYPESENSE_API_KEY=xyz
NUXT_PUBLIC_TYPESENSE_HOST=localhost
NUXT_PUBLIC_TYPESENSE_PORT=8108
NUXT_PUBLIC_TYPESENSE_PROTOCOL=http
NUXT_PUBLIC_TYPESENSE_INDEX=books
```

### 5. Project Structure

```text
├── app
│   └── app.vue
├── components
│   ├── BookCard.vue
│   ├── BookList.vue
│   ├── Heading.vue
│   └── SearchBar.vue
├── types
│   └── Book.ts
├── utils
│   └── instantSearchAdapter.ts
└── nuxt.config.ts
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Deployment

Set env variables to point the app to the Typesense Cluster:

```env
NUXT_PUBLIC_TYPESENSE_API_KEY=xxx
NUXT_PUBLIC_TYPESENSE_HOST=xxx.typesense.net
NUXT_PUBLIC_TYPESENSE_PORT=443
NUXT_PUBLIC_TYPESENSE_PROTOCOL=https
NUXT_PUBLIC_TYPESENSE_INDEX=books
```
