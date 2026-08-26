import { sql } from './config/database.ts';

const schemaPath = new URL('../db/schema.sql', import.meta.url);
const ddl = await Deno.readTextFile(schemaPath);

console.log('Applying db/schema.sql...');

try {
  await sql.unsafe(ddl).simple();
  console.log('Schema applied successfully.');
} catch (error) {
  console.error('Migration failed:', error);
  Deno.exit(1);
} finally {
  await sql.end();
}
