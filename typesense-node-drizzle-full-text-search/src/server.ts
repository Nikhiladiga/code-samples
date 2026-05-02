import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { initializeTypesense } from './search/collections';
import { determineAndRunStartupSync } from './search/sync';
import { startBackgroundSyncWorker } from './search/worker';

import booksRouter from './routes/books';
import searchRouter from './routes/search';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/books', booksRouter);
app.use('/', searchRouter);

async function startServer() {
  try {
    console.log('PostgreSQL database config loaded via Drizzle.');

    console.log('Initializing Typesense...');
    await initializeTypesense();

    console.log('Running startup sync...');
    await determineAndRunStartupSync();

    startBackgroundSyncWorker();

    app.listen(env.PORT, () => {
      console.log(`Server is running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
