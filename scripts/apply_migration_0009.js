// apply_migration_0009.js
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function applyMigration() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log('Applying migration 0009: Add folder column to brainparts table...\n');

  try {
    // Read the migration SQL file
    const sqlPath = path.join(__dirname, '..', 'drizzle', '0009_add_folder_column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8').trim();

    // Execute the migration
    await db.execute({ sql });
    console.log('✅ Migration applied successfully');

    // Set "Brodmann Areas" to folder=true
    console.log('\nSetting "Brodmann Areas" to folder=true...\n');
    
    const result = await db.execute({
      sql: 'UPDATE brainparts SET folder = 1 WHERE title = ?',
      args: ['Brodmann Areas']
    });

    console.log(`✅ Set "Brodmann Areas" (id: 490) to folder=true`);

    // Verify the change
    const verify = await db.execute({
      sql: 'SELECT id, title, folder FROM brainparts WHERE title = ?',
      args: ['Brodmann Areas']
    });

    if (verify.rows.length > 0) {
      const row = verify.rows[0];
      console.log(`\n✅ Verified: ${row.title} (id: ${row.id}) folder = ${row.folder}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyMigration().catch(console.error);
