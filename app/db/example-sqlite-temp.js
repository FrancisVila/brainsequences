import { run, all, db } from '../server/db.js';

async function main() {
  try {
    // Insert a row
    const info = run('INSERT INTO notes (content) VALUES (?)', ['Hello from better-sqlite3 - temp']);
    console.log('Inserted row id:', info.lastInsertRowid);

    // Query rows
    const rows = all('SELECT id, content, created_at FROM notes ORDER BY id DESC LIMIT 10');
    console.log('Rows:', rows);
  } catch (err) {
    console.error('DB error:', err);
  } finally {
    try { db.close(); } catch (e) {}
  }
}

main();
