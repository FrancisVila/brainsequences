import { run, all, db } from '../server/db.js';

function main() {
  try {
    // Insert a row
    const info = run('INSERT INTO notes (content) VALUES (?)', ['Hello from better-sqlite3 via wrapper']);
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

// When run as a script, execute main(). This file is ESM so we call main() directly.
main();

export default db;
