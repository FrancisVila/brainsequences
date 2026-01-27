/**
 * Script to check database migration status
 * This will:
 * 1. Check if __drizzle_migrations table exists
 * 2. List all applied migrations
 * 3. Check if tables from migration 0002 exist
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open the database
const dbPath = path.resolve(__dirname, 'data', 'app.db');
console.log('Opening database:', dbPath);
const db = new Database(dbPath);

console.log('\n=== CHECKING MIGRATION STATUS ===\n');

// Check if __drizzle_migrations table exists
try {
  const tableCheck = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='__drizzle_migrations'
  `).get();
  
  if (tableCheck) {
    console.log('✓ __drizzle_migrations table exists');
    
    // List all applied migrations
    const migrations = db.prepare(`
      SELECT * FROM __drizzle_migrations ORDER BY created_at
    `).all();
    
    console.log('\nApplied migrations:');
    migrations.forEach((migration, index) => {
      console.log(`${index + 1}. ${migration.hash} - Created: ${new Date(migration.created_at).toISOString()}`);
    });
    console.log(`\nTotal migrations applied: ${migrations.length}`);
  } else {
    console.log('✗ __drizzle_migrations table does NOT exist');
  }
} catch (error) {
  console.error('Error checking migrations table:', error.message);
}

console.log('\n=== CHECKING DATABASE TABLES ===\n');

// Get all tables in the database
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all();

console.log('Existing tables:');
tables.forEach((table, index) => {
  console.log(`${index + 1}. ${table.name}`);
});

console.log('\n=== CHECKING SPECIFIC MIGRATION TABLES ===\n');

// Check for tables that should exist from migration 0002_whole_grim_reaper.sql
const expectedTables = ['users', 'sessions', 'invitations', 'sequence_collaborators'];
const expectedColumns = {
  sequences: ['user_id', 'is_published'],
  brainparts: ['visible']
};

console.log('Checking tables from 0002_whole_grim_reaper.sql:');
expectedTables.forEach(tableName => {
  const table = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name=?
  `).get(tableName);
  
  if (table) {
    console.log(`✓ ${tableName} exists`);
  } else {
    console.log(`✗ ${tableName} MISSING`);
  }
});

console.log('\nChecking columns added by migrations:');
Object.entries(expectedColumns).forEach(([tableName, columns]) => {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const existingColumns = tableInfo.map(col => col.name);
    
    columns.forEach(colName => {
      if (existingColumns.includes(colName)) {
        console.log(`✓ ${tableName}.${colName} exists`);
      } else {
        console.log(`✗ ${tableName}.${colName} MISSING`);
      }
    });
  } catch (error) {
    console.log(`✗ Table ${tableName} does not exist or error: ${error.message}`);
  }
});

console.log('\n=== SCHEMA DETAILS ===\n');

// Show schema for key tables
const keyTables = ['sequences', 'brainparts'];
keyTables.forEach(tableName => {
  try {
    console.log(`\nTable: ${tableName}`);
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
    tableInfo.forEach(col => {
      console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ' DEFAULT ' + col.dflt_value : ''}`);
    });
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
});

db.close();
console.log('\n=== DONE ===\n');
