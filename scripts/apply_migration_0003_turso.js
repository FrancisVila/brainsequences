/**
 * Script to apply migration 0003 to Turso database
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
const migrationPath = path.resolve(__dirname, '..', 'drizzle', '0003_add_email_verification_and_password_reset.sql');
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
        console.log('⚠️  Column/table already exists, skipping');
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
  
  // Check users table structure
  const userInfo = await tursoDb.execute('PRAGMA table_info(users)');
  console.log('Users table columns:');
  const newColumns = ['email_verified', 'verification_token'];
  
  newColumns.forEach(colName => {
    const hasColumn = userInfo.rows.some(row => row.name === colName);
    if (hasColumn) {
      console.log(`✅ users.${colName} exists`);
    } else {
      console.log(`❌ users.${colName} MISSING`);
    }
  });
  
  // Check if password_resets table exists
  const tables = await tursoDb.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='password_resets'");
  if (tables.rows.length > 0) {
    console.log('✅ password_resets table exists');
  } else {
    console.log('❌ password_resets table MISSING');
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
