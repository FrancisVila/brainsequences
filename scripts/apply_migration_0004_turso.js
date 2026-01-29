/**
 * Script to apply migration 0004 to Turso database
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
const migrationPath = path.resolve(__dirname, '..', 'drizzle', '0004_add_draft_publishing_columns.sql');
console.log('Reading migration file:', migrationPath);
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('\n=== MIGRATION SQL ===');
console.log(migrationSQL);
console.log('\n=== APPLYING MIGRATION TO TURSO ===\n');

// Split the SQL by semicolon and filter out comments and empty lines
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

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
      if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
        console.log('⚠️  Column already exists, skipping');
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
  
  // Check sequences table structure
  const seqInfo = await tursoDb.execute('PRAGMA table_info(sequences)');
  console.log('Sequences table columns:');
  const newSequencesColumns = ['published_version_id', 'is_published_version', 'currently_edited_by', 'last_edited_at'];
  
  newSequencesColumns.forEach(colName => {
    const hasColumn = seqInfo.rows.some(row => row.name === colName);
    if (hasColumn) {
      console.log(`✅ sequences.${colName} exists`);
    } else {
      console.log(`❌ sequences.${colName} MISSING`);
    }
  });
  
  // Check steps table structure
  const stepInfo = await tursoDb.execute('PRAGMA table_info(steps)');
  const hasDraftColumn = stepInfo.rows.some(row => row.name === 'draft');
  
  if (hasDraftColumn) {
    console.log('✅ steps.draft exists');
  } else {
    console.log('❌ steps.draft MISSING');
  }
  
  // Check data migration
  const publishedResult = await tursoDb.execute(
    'SELECT COUNT(*) as count FROM sequences WHERE draft = 0 AND is_published_version = 1'
  );
  console.log(`\n✅ ${publishedResult.rows[0].count} published sequences have is_published_version = 1`);
  
  console.log('\n=== DONE ===\n');
}

runMigration().catch(error => {
  console.error('\n❌ MIGRATION FAILED');
  console.error('Error:', error.message);
  process.exit(1);
});
