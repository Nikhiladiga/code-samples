# SolidJS Search Bar with Typesense

A modern search bar application built with SolidJS and Typesense, featuring instant search capabilities.

## Tech Stack

- SolidJS
- Typesense
- typesense-instantsearch-adapter & instantsearch.js

## Prerequisites

- Node.js 18+ and npm 9+.
- Docker (for running Typesense locally). Alternatively, you can use a Typesense Cloud cluster.
- Basic knowledge of SolidJS.

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/typesense/code-samples.git
cd typesense-solid-js-search
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root with the following content:

```env
VITE_TYPESENSE_API_KEY=xyz
VITE_TYPESENSE_HOST=localhost
VITE_TYPESENSE_PORT=8108
VITE_TYPESENSE_PROTOCOL=http
```

### 4. Project Structure

```text
├── src
│   ├── components
│   │   ├── BookCard.tsx
│   │   ├── BookList.tsx
│   │   ├── BookSearch.tsx
│   │   ├── Heading.tsx
│   │   └── icons.tsx
│   ├── types
│   │   └── Book.ts
│   ├── utils
│   │   └── typesense.ts
│   ├── App.tsx
│   ├── index.css
│   └── index.tsx
├── index.html
└── package.json
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Deployment

Set env variables to point the app to the Typesense Cluster:

```env
VITE_TYPESENSE_API_KEY=xxx
VITE_TYPESENSE_HOST=xxx.typesense.net
VITE_TYPESENSE_PORT=443
VITE_TYPESENSE_PROTOCOL=https
```
