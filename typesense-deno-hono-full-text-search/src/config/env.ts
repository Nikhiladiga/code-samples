const REQUIRED = [
  'DATABASE_URL',
  'TYPESENSE_HOST',
  'TYPESENSE_PORT',
  'TYPESENSE_PROTOCOL',
  'TYPESENSE_API_KEY',
  'TYPESENSE_COLLECTION',
] as const;

for (const key of REQUIRED) {
  if (!Deno.env.get(key)) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const number = (key: string, fallback: number): number => {
  const raw = Deno.env.get(key);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) throw new Error(`Environment variable ${key} must be a number`);
  return parsed;
};

export const env = {
  PORT: number('PORT', 3000),
  DATABASE_URL: Deno.env.get('DATABASE_URL')!,
  TYPESENSE_HOST: Deno.env.get('TYPESENSE_HOST')!,
  TYPESENSE_PORT: number('TYPESENSE_PORT', 8108),
  TYPESENSE_PROTOCOL: Deno.env.get('TYPESENSE_PROTOCOL')!,
  TYPESENSE_API_KEY: Deno.env.get('TYPESENSE_API_KEY')!,
  TYPESENSE_COLLECTION: Deno.env.get('TYPESENSE_COLLECTION')!,
  SYNC_INTERVAL_SECONDS: number('SYNC_INTERVAL_SECONDS', 60),
  SYNC_BATCH_SIZE: number('SYNC_BATCH_SIZE', 1000),
};
