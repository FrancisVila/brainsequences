/**
 * Script to export schema from local SQLite and create it in Turso
 */

import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

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
  process.exit(1);
}

const tursoDb = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

async function exportAndApplySchema() {
  console.log('🔧 Exporting schema from local database...\n');
  
  // Get all CREATE TABLE statements
  const tables = localDb.prepare(`
    SELECT sql FROM sqlite_master 
    WHERE type='table' 
    AND name NOT LIKE 'sqlite_%'
    AND name NOT LIKE '__drizzle_%'
    AND sql IS NOT NULL
    ORDER BY name
  `).all();
  
  // Get all CREATE INDEX statements
  const indexes = localDb.prepare(`
    SELECT sql FROM sqlite_master 
    WHERE type='index' 
    AND name NOT LIKE 'sqlite_%'
    AND sql IS NOT NULL
    ORDER BY name
  `).all();
  
  console.log(`Found ${tables.length} tables and ${indexes.length} indexes\n`);
  
  // Apply to Turso
  console.log('📝 Creating tables in Turso...\n');
  
  for (const table of tables) {
    try {
      console.log(`Creating table...`);
      console.log(table.sql.substring(0, 100) + '...\n');
      await tursoDb.execute(table.sql);
      console.log('✅ Success\n');
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('📝 Creating indexes in Turso...\n');
  
  for (const index of indexes) {
    try {
      console.log(`Creating index...`);
      console.log(index.sql.substring(0, 100) + '...\n');
      await tursoDb.execute(index.sql);
      console.log('✅ Success\n');
    } catch (error) {
      // Indexes might fail if they already exist, that's okay
      if (!error.message.includes('already exists')) {
        console.error(`❌ Error: ${error.message}\n`);
      }
    }
  }
  
  console.log('✨ Schema export complete!\n');
  console.log('You can now run: node migrate-to-turso.js');
  
  localDb.close();
}

exportAndApplySchema().catch(console.error);
