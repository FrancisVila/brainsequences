import { db } from './db.js';

// Initialize schema (idempotent)
db.exec(`


  -- Sequences table
  CREATE TABLE IF NOT EXISTS sequences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Steps table
  CREATE TABLE IF NOT EXISTS steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sequence_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
  );

  -- Brain parts table
  CREATE TABLE IF NOT EXISTS brainparts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    is_part_of INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (is_part_of) REFERENCES brainparts(id) ON DELETE SET NULL
  );

  -- More info links for brain parts (many-to-many)
  CREATE TABLE IF NOT EXISTS brainpart_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brainpart_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brainpart_id) REFERENCES brainparts(id) ON DELETE CASCADE
  );

  -- Steps to brain parts relationship (many-to-many)
  CREATE TABLE IF NOT EXISTS step_brainparts (
    step_id INTEGER NOT NULL,
    brainpart_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (step_id, brainpart_id),
    FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE,
    FOREIGN KEY (brainpart_id) REFERENCES brainparts(id) ON DELETE CASCADE
  );

  -- Arrows (relationships between brain parts)
  CREATE TABLE IF NOT EXISTS arrows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    from_brainpart_id INTEGER NOT NULL,
    to_brainpart_id INTEGER NOT NULL,
    step_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_brainpart_id) REFERENCES brainparts(id) ON DELETE CASCADE,
    FOREIGN KEY (to_brainpart_id) REFERENCES brainparts(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE
  );
`);

// Ensure `is_part_of` column exists on older DBs where the table was created
// before that column was added. SQLite doesn't support adding a foreign key
// with ALTER TABLE easily, but we can add the column if missing.
(function ensureIsPartOfColumn() {
  try {
    const row = db.prepare("PRAGMA table_info('brainparts')").all();
    const has = row.some(r => r.name === 'is_part_of');
    if (!has) {
      console.log('Adding missing column is_part_of to brainparts...');
      db.exec('ALTER TABLE brainparts ADD COLUMN is_part_of INTEGER');
      // Note: foreign key constraint cannot be added via ALTER TABLE in SQLite.
    }
  } catch (err) {
    console.error('Error ensuring is_part_of column:', err);
  }
})();