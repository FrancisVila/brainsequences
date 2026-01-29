/**
 * Script to apply migration 0004_add_draft_publishing_columns.sql
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
const dbPath = path.resolve(__dirname, '..', 'data', 'app.db');
console.log('Opening database:', dbPath);
const db = new Database(dbPath);

// Read the migration file
const migrationPath = path.resolve(__dirname, '..', 'drizzle', '0004_add_draft_publishing_columns.sql');
console.log('Reading migration file:', migrationPath);
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('\n=== MIGRATION SQL ===');
console.log(migrationSQL);
console.log('\n=== APPLYING MIGRATION ===\n');

// Split the SQL by line and filter out comments and empty lines
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

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
      // Check if error is because column already exists
      if (error.message.includes('duplicate column name')) {
        console.log('⚠ Column already exists, skipping\n');
        successCount++;
      } else {
        console.error('✗ Error:', error.message);
        throw error;
      }
    }
  }
  
  // Generate a hash for the migration
  const migrationHash = crypto.createHash('sha256')
    .update('0004_add_draft_publishing_columns')
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

console.log('Checking sequences table columns:');
const sequencesInfo = db.prepare(`PRAGMA table_info(sequences)`).all();
const newSequencesColumns = ['published_version_id', 'is_published_version', 'currently_edited_by', 'last_edited_at'];

newSequencesColumns.forEach(colName => {
  const hasColumn = sequencesInfo.some(col => col.name === colName);
  if (hasColumn) {
    console.log(`✓ sequences.${colName} exists`);
  } else {
    console.log(`✗ sequences.${colName} MISSING`);
  }
});

console.log('\nChecking steps table columns:');
const stepsInfo = db.prepare(`PRAGMA table_info(steps)`).all();
const hasDraftColumn = stepsInfo.some(col => col.name === 'draft');

if (hasDraftColumn) {
  console.log('✓ steps.draft exists');
} else {
  console.log('✗ steps.draft MISSING');
}

// Check data migration
console.log('\nChecking data migration:');
const publishedCount = db.prepare('SELECT COUNT(*) as count FROM sequences WHERE draft = 0 AND is_published_version = 1').get();
console.log(`✓ ${publishedCount.count} published sequences have is_published_version = 1`);

db.close();
console.log('\n=== DONE ===\n');
