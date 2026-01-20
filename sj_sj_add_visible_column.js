import Database from 'better-sqlite3';

const db = new Database('./data/app.db');
db.exec('ALTER TABLE brainparts ADD COLUMN visible integer NOT NULL DEFAULT 1;');
console.log('Added visible column to brainparts table');
db.close();
