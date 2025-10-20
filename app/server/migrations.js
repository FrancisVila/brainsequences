import { db } from './db.js';

// Initialize schema (idempotent)
db.exec(`
  -- Notes table (existing)
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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