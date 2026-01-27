/**
 * Script to manually apply migration 0002_whole_grim_reaper.sql
 * 
 * This script will:
 * 1. Read the migration SQL file
 * 2. Execute the SQL statements
 * 3. Record the migration in __drizzle_migrations table
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open the database
const dbPath = path.resolve(__dirname, 'data', 'app.db');
console.log('Opening database:', dbPath);
const db = new Database(dbPath);

// Read the migration file
const migrationPath = path.resolve(__dirname, 'drizzle', '0002_whole_grim_reaper.sql');
console.log('Reading migration file:', migrationPath);
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('\n=== MIGRATION SQL ===');
console.log(migrationSQL);
console.log('\n=== APPLYING MIGRATION ===\n');

// Split the SQL by statement-breakpoint comments
const statements = migrationSQL
  .split('--> statement-breakpoint')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`Found ${statements.length} SQL statements to execute\n`);

// Execute within a transaction
try {
  db.exec('BEGIN TRANSACTION');
  
  let successCount = 0;
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
    
    try {
      db.exec(statement);
      console.log('✓ Success\n');
      successCount++;
    } catch (error) {
      // Check if error is because column/table already exists
      if (error.message.includes('already exists') || error.message.includes('duplicate column name')) {
        console.log('⚠ Already exists, skipping\n');
        successCount++;
      } else {
        console.error('✗ Error:', error.message);
        throw error;
      }
    }
  }
  
  // Generate a hash for the migration (using the migration filename as hash)
  const migrationHash = crypto.createHash('sha256')
    .update('0002_whole_grim_reaper')
    .digest('hex')
    .substring(0, 16);
  
  // Record the migration
  console.log('\nRecording migration in __drizzle_migrations table...');
  const timestamp = Date.now();
  
  try {
    db.prepare(`
      INSERT INTO __drizzle_migrations (hash, created_at)
      VALUES (?, ?)
    `).run(migrationHash, timestamp);
    console.log('✓ Migration recorded');
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log('⚠ Migration already recorded');
    } else {
      throw error;
    }
  }
  
  db.exec('COMMIT');
  console.log('\n✓ MIGRATION APPLIED SUCCESSFULLY');
  console.log(`\nExecuted ${successCount}/${statements.length} statements`);
  
} catch (error) {
  db.exec('ROLLBACK');
  console.error('\n✗ MIGRATION FAILED');
  console.error('Error:', error.message);
  console.error('Transaction rolled back');
  process.exit(1);
}

// Verify the migration
console.log('\n=== VERIFYING MIGRATION ===\n');

const tables = ['users', 'sessions', 'invitations', 'sequence_collaborators'];
tables.forEach(tableName => {
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

// Check new columns in sequences table
console.log('\nChecking sequences table columns:');
const sequencesInfo = db.prepare(`PRAGMA table_info(sequences)`).all();
const hasUserId = sequencesInfo.some(col => col.name === 'user_id');
const hasIsPublished = sequencesInfo.some(col => col.name === 'is_published');

if (hasUserId) {
  console.log('✓ sequences.user_id exists');
} else {
  console.log('✗ sequences.user_id MISSING');
}

if (hasIsPublished) {
  console.log('✓ sequences.is_published exists');
} else {
  console.log('✗ sequences.is_published MISSING');
}

db.close();
console.log('\n=== DONE ===\n');
