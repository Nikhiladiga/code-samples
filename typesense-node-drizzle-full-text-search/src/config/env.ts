import * as dotenv from 'dotenv';
dotenv.config();

const requiredEnvs = [
  'DATABASE_URL',
  'TYPESENSE_HOST',
  'TYPESENSE_PORT',
  'TYPESENSE_PROTOCOL',
  'TYPESENSE_API_KEY',
  'TYPESENSE_COLLECTION',
] as const;

for (const env of requiredEnvs) {
  if (!process.env[env]) {
    throw new Error(`Missing required environment variable: ${env}`);
  }
}

export const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL!,
  TYPESENSE_HOST: process.env.TYPESENSE_HOST!,
  TYPESENSE_PORT: parseInt(process.env.TYPESENSE_PORT!, 10),
  TYPESENSE_PROTOCOL: process.env.TYPESENSE_PROTOCOL!,
  TYPESENSE_API_KEY: process.env.TYPESENSE_API_KEY!,
  TYPESENSE_COLLECTION: process.env.TYPESENSE_COLLECTION!,
};
