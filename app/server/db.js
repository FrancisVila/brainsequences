import Database from 'better-sqlite3';
import path from 'path';

// Server-side wrapper for better-sqlite3
// DB file will be stored in the project's data/ folder
const dbPath = path.resolve(process.cwd(), 'data', 'app.db');
const db = new Database(dbPath);


export function run(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...(Array.isArray(params) ? params : [params]));
}

export function all(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...(Array.isArray(params) ? params : [params]));
}

export function get(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...(Array.isArray(params) ? params : [params]));
}

export function close() {
  try {
    db.close();
  } catch (e) {
    // ignore if already closed
  }
}

export { db };

// Keep Node process from exiting immediately in some server contexts
// (not strictly necessary here, but useful when running ad-hoc scripts)
export function ensureOpen() {
  // noop - the DB is opened synchronously on import
}

export default db;
