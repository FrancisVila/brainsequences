/**
 * Script to apply migration 0006 (add hover to citations) to Turso database
 */

import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Turso database
const tursoUrl = process.env.DATABASE_URL;
const tursoAuthToken = process.env.DATABASE_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
  console.error('❌ Missing Turso credentials in .env file');
  console.error('Required: DATABASE_URL and DATABASE_AUTH_TOKEN');
  process.exit(1);
}

const tursoDb = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

// Read the migration file
const migrationPath = path.resolve(__dirname, '..', 'drizzle', '0006_add_hover_to_citations.sql');
console.log('Reading migration file:', migrationPath);
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('\n=== MIGRATION SQL ===');
console.log(migrationSQL);
console.log('\n=== APPLYING MIGRATION TO TURSO ===\n');

// Parse SQL statements manually
const statements = [];
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

async function runMigration() {
  let successCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
    console.log(statement.substring(0, 150) + (statement.length > 150 ? '...' : ''));
    
    try {
      await tursoDb.execute(statement);
      console.log('✅ Success');
      successCount++;
    } catch (error) {
      // Check if error is because column already exists
      if (error.message.includes('duplicate column name') || 
          error.message.includes('already exists')) {
        console.log('⚠️  Already exists, skipping');
        successCount++;
      } else {
        console.error('❌ Error:', error.message);
        throw error;
      }
    }
  }
  
  console.log(`\n✅ MIGRATION APPLIED SUCCESSFULLY`);
  console.log(`Executed ${successCount}/${statements.length} statements`);
  
  // Verify the migration
  console.log('\n=== VERIFYING MIGRATION ===\n');
  
  // Check citations table for hover column
  console.log('Checking citations table:');
  try {
    const citationsInfo = await tursoDb.execute('PRAGMA table_info(citations)');
    if (citationsInfo.rows.length > 0) {
      console.log('✅ citations table exists');
      console.log('Citations columns:', citationsInfo.rows.map(r => r.name).join(', '));
      
      const hasHover = citationsInfo.rows.some(r => r.name === 'hover');
      if (hasHover) {
        console.log('✅ citations.hover column exists');
      } else {
        console.log('❌ citations.hover column MISSING');
      }
    } else {
      console.log('❌ citations table does not exist');
    }
  } catch (error) {
    console.log('❌ Error checking citations table:', error.message);
  }
  
  console.log('\n=== MIGRATION COMPLETE ===\n');
}

runMigration()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ MIGRATION FAILED');
    console.error(error);
    process.exit(1);
  });
