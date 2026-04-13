# Angular Search Bar with Typesense

A modern search bar application built with Angular and Typesense, featuring instant search capabilities.

## Tech Stack

- Angular 18 (LTS)
- Typesense
- typesense-instantsearch-adapter & instantsearch.js

## Prerequisites

- Node.js 18+ and npm 9+.
- Docker (for running Typesense locally). Alternatively, you can use a Typesense Cloud cluster.
- Basic knowledge of Angular.

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/typesense/code-samples.git
cd typesense-angular-search-bar
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and fill in your Typesense connection details:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
```

Then edit `src/environments/environment.ts`:

```typescript
export const environment = {
  typesense: {
    apiKey: 'your-api-key',
    host: 'localhost',
    port: 8108,
    protocol: 'http',
    index: 'books',
  },
};
```

### 4. Project Structure

```text
src/app/
├── components/
│   ├── heading/          # App title and branding
│   ├── search-bar/       # Search input
│   ├── book-list/        # Results grid
│   └── book-card/        # Individual book display
├── lib/
│   └── instantsearch-adapter.ts   # Typesense adapter config
├── services/
│   └── search.service.ts # InstantSearch singleton
├── types/
│   └── book.ts           # Book type definition
├── app.component.*       # Root component
└── app.config.ts         # Angular app configuration
```

### 5. Start the development server

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

### 6. Deployment

Update `src/environments/environment.ts` to point to your Typesense Cloud cluster:

```typescript
export const environment = {
  typesense: {
    apiKey: 'your-search-only-api-key',
    host: 'xxx.typesense.net',
    port: 443,
    protocol: 'https',
    index: 'books',
  },
};
```
