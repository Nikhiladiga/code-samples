# Qwik Search Bar with Typesense

A modern search bar application built with Qwik and Typesense, featuring instant search capabilities.

## Features

- ⚡ **Instant Search** - Real-time search powered by InstantSearch.js
- 🎨 **Modern UI** - Clean, responsive design with gradient animations
- 📚 **Book Display** - Grid layout with book covers, ratings, and metadata
- 🔍 **Smart Search** - Weighted field search with typo tolerance
- 📱 **Responsive** - Adapts to mobile, tablet, and desktop screens
- ⭐ **Rating Display** - Visual star ratings and review counts
- 🔄 **Loading Indicators** - Built-in loading states from InstantSearch.js

## Tech Stack

- **Qwik** - Resumable framework for building fast web applications
- **Qwik City** - Directory-based routing and layouts
- **Typesense** - Open-source search engine
- **InstantSearch.js** - UI library for building search experiences
- **typesense-instantsearch-adapter** - Adapter to connect Typesense with InstantSearch.js
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Next-generation build tool

## Prerequisites

- Node.js 18+ and npm 9+
- Docker (for running Typesense locally). Alternatively, you can use a Typesense Cloud cluster.

## Quick Start

### 1. Clone the repository

```bash
cd typesense-qwik-js-search
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```env
PUBLIC_TYPESENSE_API_KEY=xyz
PUBLIC_TYPESENSE_HOST=localhost
PUBLIC_TYPESENSE_PORT=8108
PUBLIC_TYPESENSE_PROTOCOL=http
PUBLIC_TYPESENSE_INDEX=books
```

### 4. Project Structure

```plaintext
├── src/
│   ├── components/
│   │   ├── BookCard.tsx           # Individual book card component
│   │   ├── BookList.tsx           # Book list grid component
│   │   ├── Heading.tsx            # Page heading with branding
│   │   └── icons.tsx              # SVG icons (GitHub, Qwik)
│   ├── routes/
│   │   └── index.tsx              # Main page with InstantSearch integration
│   ├── types/
│   │   └── Book.ts                # TypeScript type definitions
│   ├── utils/
│   │   └── typesense.ts           # Typesense-InstantSearch adapter config
│   └── global.css                 # Global styles and InstantSearch CSS
└── public/
```

### 5. Start Typesense

Run a local Typesense instance using Docker:

```bash
docker run -p 8108:8108 \
  --volume /tmp/typesense-data:/data \
  typesense/typesense:0.25.2 \
  --data-dir /data \
  --api-key=xyz \
  --enable-cors
```

### 6. Index data into Typesense

If you have the Gin backend running, trigger a sync:

```bash
curl -X POST http://localhost:3000/sync
```

Or manually create a collection and index documents using the Typesense API.

### 7. Start the development server

```bash
npm run dev
```

Open <http://localhost:5173> to see the search bar in action.

## Configuration

The Typesense-InstantSearch adapter is configured in `src/utils/typesense.ts`:

```typescript
import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";

export const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: import.meta.env.PUBLIC_TYPESENSE_API_KEY || "xyz",
    nodes: [
      {
        host: import.meta.env.PUBLIC_TYPESENSE_HOST || "localhost",
        port: Number(import.meta.env.PUBLIC_TYPESENSE_PORT) || 8108,
        protocol: import.meta.env.PUBLIC_TYPESENSE_PROTOCOL || "http",
      },
    ],
  },
  additionalSearchParameters: {
    query_by: "title,authors",
    query_by_weights: "4,2",  // Title weighted 2x more than authors
    num_typos: 1,              // Allow 1 typo for fuzzy matching
    sort_by: "ratings_count:desc",  // Sort by popularity
  },
});

export const searchClient = typesenseInstantsearchAdapter.searchClient;
export const INDEX_NAME = import.meta.env.PUBLIC_TYPESENSE_INDEX || "books";
```

### InstantSearch Integration

The search UI is powered by InstantSearch.js widgets initialized in `useVisibleTask$`:

- **searchBox**: Provides the search input with built-in reset and loading indicators
- **hits**: Handles search results and transforms them into the Book type
- **configure**: Sets search parameters like hits per page

The integration uses `transformItems` to update Qwik signals with search results, allowing reactive UI updates while leveraging InstantSearch's powerful features.

## How It Works

This implementation follows the pattern from the [official Typesense Qwik showcase](https://github.com/typesense/showcase-guitar-chords-search-qwik):

1. **Adapter Setup**: The `typesense-instantsearch-adapter` bridges Typesense and InstantSearch.js
2. **Client-Side Initialization**: InstantSearch widgets are initialized in `useVisibleTask$` (runs after component renders)
3. **Widget Integration**: InstantSearch widgets (searchBox, hits) are mounted to DOM containers
4. **Reactive Updates**: The `transformItems` callback updates Qwik signals with search results
5. **Custom Rendering**: Results are rendered using custom Qwik components (BookCard, BookList)

## Deployment

For production deployment:

1. Set the environment variables to point to your Typesense Cloud cluster:

   ```env
   PUBLIC_TYPESENSE_API_KEY=your-production-api-key
   PUBLIC_TYPESENSE_HOST=xxx.typesense.net
   PUBLIC_TYPESENSE_PORT=443
   PUBLIC_TYPESENSE_PROTOCOL=https
   PUBLIC_TYPESENSE_INDEX=books
   ```

2. Build the application:

   ```bash
   npm run build
   ```

3. Preview the production build:

   ```bash
   npm run preview
   ```

## License

MIT