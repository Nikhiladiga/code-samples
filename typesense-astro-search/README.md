# Astro Search Bar with Typesense

A modern search bar application built with Astro and Typesense, featuring instant search capabilities.

## Tech Stack

- Astro
- Typesense
- typesense-instantsearch-adapter & instantsearch.js

## Prerequisites

- Node.js 18+ and npm 9+.
- Docker (for running Typesense locally). Alternatively, you can use a Typesense Cloud cluster.
- Basic knowledge of Astro.

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/typesense/code-samples.git
cd typesense-astro-search
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root with the following content:

```env
PUBLIC_TYPESENSE_API_KEY=xyz
PUBLIC_TYPESENSE_HOST=localhost
PUBLIC_TYPESENSE_PORT=8108
PUBLIC_TYPESENSE_PROTOCOL=http
```

### 4. Project Structure

```text
├── src
│   ├── components
│   │   ├── BookCard.astro
│   │   ├── BookSearch.astro
│   │   └── Heading.astro
│   ├── pages
│   │   └── index.astro
│   ├── types
│   │   └── Book.ts
│   └── utils
│       └── typesense.ts
└── public
    └── favicon.svg
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### 6. Deployment

Set env variables to point the app to the Typesense Cluster:

```env
PUBLIC_TYPESENSE_API_KEY=xxx
PUBLIC_TYPESENSE_HOST=xxx.typesense.net
PUBLIC_TYPESENSE_PORT=443
PUBLIC_TYPESENSE_PROTOCOL=https
```
