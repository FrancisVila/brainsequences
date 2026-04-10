/**
 * Script to apply migration 0007 (add version to brainparts) to Turso database
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
const migrationPath = path.resolve(__dirname, '..', 'drizzle', '0007_add_version_to_brainparts.sql');
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
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
    continue;
  }

  currentStatement += ' ' + trimmedLine;

  if (trimmedLine.endsWith(';')) {
    statements.push(currentStatement.trim());
    currentStatement = '';
  }
}

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

  console.log('Checking brainparts table:');
  try {
    const brainpartsInfo = await tursoDb.execute('PRAGMA table_info(brainparts)');
    if (brainpartsInfo.rows.length > 0) {
      console.log('✅ brainparts table exists');
      console.log('Brainparts columns:', brainpartsInfo.rows.map(r => r.name).join(', '));

      const hasVersion = brainpartsInfo.rows.some(r => r.name === 'version');
      if (hasVersion) {
        console.log('✅ brainparts.version column exists');
      } else {
        console.log('❌ brainparts.version column MISSING');
      }
    } else {
      console.log('❌ brainparts table does not exist');
    }
  } catch (error) {
    console.log('❌ Error checking brainparts table:', error.message);
  }

  console.log('\n=== MIGRATION COMPLETE ===\n');
}

runMigration();
