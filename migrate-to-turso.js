/**
 * Migration script to copy data from local SQLite to Turso
 * 
 * This script will:
 * 1. Push the schema to Turso using drizzle-kit
 * 2. Read all data from local app.db
 * 3. Insert it into Turso database
 * 
 * Usage:
 *   node migrate-to-turso.js
 */

import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local SQLite database
const localDbPath = path.resolve(__dirname, 'data', 'app.db');
const localDb = new Database(localDbPath);

// Turso database
const tursoUrl = process.env.DATABASE_URL;
const tursoAuthToken = process.env.DATABASE_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
  console.error('❌ Missing Turso credentials in .env file');
  console.error('Make sure DATABASE_URL and DATABASE_AUTH_TOKEN are set');
  process.exit(1);
}

const tursoDb = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

// Get all tables from local database
function getAllTables() {
  const tables = localDb.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND name NOT LIKE 'sqlite_%'
    AND name NOT LIKE '__drizzle_%'
    ORDER BY name
  `).all();
  return tables.map(t => t.name);
}

// Get row count for a table
function getRowCount(tableName) {
  return localDb.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
}

// Migrate a single table
async function migrateTable(tableName) {
  console.log(`\n📋 Migrating table: ${tableName}`);
  
  // Get all rows from local database
  const rows = localDb.prepare(`SELECT * FROM ${tableName}`).all();
  
  if (rows.length === 0) {
    console.log(`  ℹ️  Table is empty, skipping`);
    return { success: true, count: 0 };
  }
  
  console.log(`  Found ${rows.length} rows to migrate`);
  
  // Get column names from first row
  const columns = Object.keys(rows[0]);
  
  // Build INSERT statement
  const placeholders = columns.map(() => '?').join(', ');
  const columnNames = columns.join(', ');
  const insertSql = `INSERT OR REPLACE INTO ${tableName} (${columnNames}) VALUES (${placeholders})`;
  
  let successCount = 0;
  let errorCount = 0;
  
  // Insert rows one by one (Turso doesn't support batch inserts the same way)
  for (const row of rows) {
    try {
      const values = columns.map(col => row[col]);
      await tursoDb.execute({
        sql: insertSql,
        args: values,
      });
      successCount++;
    } catch (error) {
      console.error(`  ❌ Error inserting row: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`  ✅ Migrated ${successCount} rows`);
  if (errorCount > 0) {
    console.log(`  ⚠️  ${errorCount} rows failed`);
  }
  
  return { success: errorCount === 0, count: successCount };
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting migration from local SQLite to Turso\n');
  console.log(`Local database: ${localDbPath}`);
  console.log(`Turso database: ${tursoUrl}\n`);
  
  try {
    // Get all tables
    const tables = getAllTables();
    console.log(`Found ${tables.length} tables to migrate:`, tables.join(', '));
    
    // Show row counts
    console.log('\n📊 Row counts in local database:');
    tables.forEach(table => {
      const count = getRowCount(table);
      console.log(`  ${table}: ${count} rows`);
    });
    
    // Define table migration order (to respect foreign keys)
    const migrationOrder = [
      'users',
      'sessions',
      'brainparts',
      'sequences',
      'steps',
      'step_brainparts',
      'arrows',
      'sequence_collaborators',
      'invitations',
      'password_resets',
    ];
    
    // Filter to only include tables that exist
    const tablesToMigrate = migrationOrder.filter(t => tables.includes(t));
    
    // Add any remaining tables not in the order list
    const remainingTables = tables.filter(t => !migrationOrder.includes(t));
    tablesToMigrate.push(...remainingTables);
    
    console.log('\n📦 Starting data migration...');
    
    let totalSuccess = 0;
    let totalFailed = 0;
    
    for (const table of tablesToMigrate) {
      const result = await migrateTable(table);
      totalSuccess += result.count;
      if (!result.success) totalFailed++;
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✨ Migration complete!');
    console.log(`   Total rows migrated: ${totalSuccess}`);
    if (totalFailed > 0) {
      console.log(`   ⚠️  Tables with errors: ${totalFailed}`);
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    localDb.close();
  }
}

// Run migration
migrate().catch(console.error);
