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

### 3. Set up environment variables

Create a `.env` file in the project root with the following content:

```env
NUXT_PUBLIC_TYPESENSE_API_KEY=xxx
NUXT_PUBLIC_TYPESENSE_HOST=localhost
NUXT_PUBLIC_TYPESENSE_PORT=8108
NUXT_PUBLIC_TYPESENSE_PROTOCOL=http
NUXT_PUBLIC_TYPESENSE_INDEX=books
```

### 4. Project Structure

```text
├── app
│   └── app.vue
├── components
│   ├── BookCard.vue
│   ├── BookList.vue
│   ├── Heading.vue
│   ├── Icons.vue
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
