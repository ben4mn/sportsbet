import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path - use /app/data in production for Docker volume
const dbPath = process.env.NODE_ENV === 'production'
  ? '/app/data/sportsbet.db'
  : join(__dirname, '../../data/sportsbet.db');

let db;

export function getDatabase() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDatabase() {
  const database = getDatabase();

  // Read and execute schema
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  database.exec(schema);

  console.log('Database initialized successfully');
  return database;
}

export default { getDatabase, initDatabase };
