# SvelteKit Search Bar with Typesense

A modern search bar application built with SvelteKit and Typesense, featuring instant search capabilities.

## Tech Stack

- SvelteKit (Svelte 5)
- Typesense
- typesense-instantsearch-adapter & instantsearch.js

## Prerequisites

- Node.js 18+ and npm 9+.
- Docker (for running Typesense locally). Alternatively, you can use a Typesense Cloud cluster.
- Basic knowledge of Svelte and SvelteKit.

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/typesense/code-samples.git
cd typesense-sveltekit-search-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root with the following content:

```env
PUBLIC_TYPESENSE_API_KEY=xxx
PUBLIC_TYPESENSE_HOST=localhost
PUBLIC_TYPESENSE_PORT=8108
PUBLIC_TYPESENSE_PROTOCOL=http
```

### 4. Project Structure

```text
├── src
│   ├── lib
│   │   ├── components
│   │   │   └── UI components...
│   │   ├── instantSearchAdapter.ts
│   │   ├── searchService.svelte.ts
│   │   └── types.ts
│   └── routes
│       ├── +page.svelte
│       └── +page.ts
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Deployment

Set env variables to point the app to the Typesense Cluster:

```env
PUBLIC_TYPESENSE_API_KEY=xxx
PUBLIC_TYPESENSE_HOST=xxx.typesense.net
PUBLIC_TYPESENSE_PORT=443
PUBLIC_TYPESENSE_PROTOCOL=https
PUBLIC_TYPESENSE_INDEX=books
```
