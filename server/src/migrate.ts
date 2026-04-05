import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'migrations');

const files = (await readdir(migrationsDir))
  .filter((f) => f.endsWith('.sql'))
  .sort();

const client = await pool.connect();
try {
  await client.query('BEGIN');
  for (const file of files) {
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    console.log(`Running ${file}`);
    await client.query(sql);
  }
  await client.query('COMMIT');
  console.log('Migrations complete');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
  await pool.end();
}
