import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './config/env.ts';
import { initializeTypesense } from './search/collections.ts';
import { determineAndRunStartupSync } from './search/sync.ts';
import { startBackgroundSyncWorker } from './search/worker.ts';
import booksRouter from './routes/books.ts';
import searchRouter from './routes/search.ts';

const app = new Hono();

app.use('*', cors());
app.route('/books', booksRouter);
app.route('/', searchRouter);

console.log('Initializing Typesense collection...');
await initializeTypesense();

console.log('Running startup sync...');
try {
  await determineAndRunStartupSync();
} catch (error) {
  console.error('Startup sync failed, continuing anyway:', error);
}

startBackgroundSyncWorker();

Deno.serve({ port: env.PORT }, app.fetch);
console.log(`Server is running on http://localhost:${env.PORT}`);
