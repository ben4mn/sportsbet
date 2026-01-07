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

  // Run migrations for existing databases
  runMigrations(database);

  console.log('Database initialized successfully');
  return database;
}

function runMigrations(database) {
  // Check if team_focus column exists, add if not
  const columns = database.prepare(`PRAGMA table_info(preferences)`).all();
  const columnNames = columns.map(c => c.name);

  if (!columnNames.includes('team_focus')) {
    console.log('Running migration: adding team_focus column');
    database.exec(`ALTER TABLE preferences ADD COLUMN team_focus TEXT DEFAULT '[]'`);
  }

  if (!columnNames.includes('avoid_teams')) {
    console.log('Running migration: adding avoid_teams column');
    database.exec(`ALTER TABLE preferences ADD COLUMN avoid_teams TEXT DEFAULT '[]'`);
  }
}

export default { getDatabase, initDatabase };
