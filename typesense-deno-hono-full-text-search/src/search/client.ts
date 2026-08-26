import { Client } from 'typesense';
import { env } from '../config/env.ts';

export const typesenseClient = new Client({
  nodes: [{
    host: env.TYPESENSE_HOST,
    port: env.TYPESENSE_PORT,
    protocol: env.TYPESENSE_PROTOCOL,
  }],
  apiKey: env.TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 5,
  retryIntervalSeconds: 1,
  numRetries: 3,
});
