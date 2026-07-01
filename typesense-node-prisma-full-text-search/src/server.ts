import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { prisma } from './config/database';
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
    // 1. Connect to PostgreSQL
    console.log('Connecting to PostgreSQL database...');
    await prisma.$connect();
    console.log('Database connected.');

    // 2. Initialize Typesense
    console.log('Initializing Typesense...');
    await initializeTypesense();

    // 3. Run Startup Sync
    console.log('Running startup sync...');
    await determineAndRunStartupSync();

    // 4. Start Background Worker
    startBackgroundSyncWorker();

    // 5. Start Express API
    app.listen(env.PORT, () => {
      console.log(`Server is running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
