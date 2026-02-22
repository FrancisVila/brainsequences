/**
 * Script to apply migration 0006_add_hover_to_citations.sql
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
const migrationPath = path.resolve(__dirname, '..', 'drizzle', '0006_add_hover_to_citations.sql');
console.log('Reading migration file:', migrationPath);
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('\n=== MIGRATION SQL ===');
console.log(migrationSQL);
console.log('\n=== APPLYING MIGRATION ===\n');

// Split SQL into statements manually
const statements = [];

// Extract lines and build statements
const lines = migrationSQL.split('\n');
let currentStatement = '';

for (const line of lines) {
  const trimmedLine = line.trim();
  
  // Skip comments and empty lines
  if (!trimmedLine || trimmedLine.startsWith('--')) {
    // If we have a current statement and hit a comment/empty, finalize it
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
    continue;
  }
  
  // Add line to current statement
  currentStatement += ' ' + trimmedLine;
  
  // Check if line ends with semicolon (end of statement)
  if (trimmedLine.endsWith(';')) {
    statements.push(currentStatement.trim());
    currentStatement = '';
  }
}

// Add any remaining statement
if (currentStatement.trim()) {
  statements.push(currentStatement.trim());
}

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
      successCount++;
      console.log('✓ Success\n');
    } catch (err) {
      console.error('✗ Error:', err.message);
      throw err;
    }
  }
  
  console.log(`Successfully executed ${successCount}/${statements.length} statements\n`);
  
  // Record the migration in __drizzle_migrations table
  console.log('Recording migration in __drizzle_migrations table...');
  
  // Create a hash for the migration
  const hash = crypto.createHash('md5').update(migrationSQL).digest('hex').substring(0, 16);
  const created_at = Date.now();
  
  db.prepare(`
    INSERT INTO __drizzle_migrations (hash, created_at)
    VALUES (?, ?)
  `).run(hash, created_at);
  
  console.log(`✓ Migration recorded with hash: ${hash}\n`);
  
  db.exec('COMMIT');
  console.log('=== MIGRATION COMPLETED SUCCESSFULLY ===\n');
  
} catch (error) {
  db.exec('ROLLBACK');
  console.error('\n=== MIGRATION FAILED ===');
  console.error('Error:', error.message);
  console.error('Transaction rolled back\n');
  process.exit(1);
}

// Verify the changes
console.log('=== VERIFYING CHANGES ===\n');

console.log('Checking citations table schema:');
const citationsInfo = db.prepare("PRAGMA table_info('citations')").all();
console.log('Citations columns:', citationsInfo.map(col => col.name).join(', '));

const hasHover = citationsInfo.some(col => col.name === 'hover');
if (hasHover) {
  console.log('✓ citations.hover column exists\n');
} else {
  console.log('✗ citations.hover column MISSING\n');
}

db.close();
console.log('\n=== DONE ===\n');
