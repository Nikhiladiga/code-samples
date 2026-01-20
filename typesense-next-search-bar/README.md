# Next.js Search Bar with Typesense

A modern search bar application built with Next.js and Typesense, featuring instant search capabilities.

## Tech Stack

- Next.js
- Typesense
- typesense-instantsearch-adapter & react-instantsearch

## Prerequisites

- Node.js 18+ and npm 9+.
- Docker (for running Typesense locally). Alternatively, you can use a Typesense Cloud cluster.
- Basic knowledge of React and Next.js.

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/typesense/code-samples.git
cd typesense-next-search-bar
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root with the following content:

```env
NEXT_PUBLIC_TYPESENSE_API_KEY=xxx
NEXT_PUBLIC_TYPESENSE_HOST=localhost
NEXT_PUBLIC_TYPESENSE_PORT=8108
NEXT_PUBLIC_TYPESENSE_PROTOCOL=http
NEXT_PUBLIC_TYPESENSE_INDEX=books
```

### 4. Project Structure

```text
├── components
│   ├── UI components...
├── lib
│   └── instantSearchAdapter.ts
├── pages
│   └── index.tsx
└── types
    └── Book.ts
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Deployment

Set env variables to point the app to the Typesense Cluster:

```env
NEXT_PUBLIC_TYPESENSE_API_KEY=xxx
NEXT_PUBLIC_TYPESENSE_HOST=xxx.typesense.net
NEXT_PUBLIC_TYPESENSE_PORT=443
NEXT_PUBLIC_TYPESENSE_PROTOCOL=https
NEXT_PUBLIC_TYPESENSE_INDEX=books
```
