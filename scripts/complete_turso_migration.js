import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const tursoDb = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function runMissingStatements() {
  console.log('Adding missing columns to Turso...\n');
  
  try {
    console.log('1. Adding published_version_id to sequences...');
    await tursoDb.execute('ALTER TABLE sequences ADD COLUMN published_version_id INTEGER REFERENCES sequences(id) ON DELETE SET NULL');
    console.log('✅ Success\n');
  } catch (error) {
    console.log(`⚠️  ${error.message}\n`);
  }
  
  try {
    console.log('2. Adding draft to steps...');
    await tursoDb.execute('ALTER TABLE steps ADD COLUMN draft INTEGER NOT NULL DEFAULT 1');
    console.log('✅ Success\n');
  } catch (error) {
    console.log(`⚠️  ${error.message}\n`);
  }
  
  try {
    console.log('3. Updating is_published_version for published sequences...');
    await tursoDb.execute('UPDATE sequences SET is_published_version = 1 WHERE draft = 0');
    console.log('✅ Success\n');
  } catch (error) {
    console.log(`❌ ${error.message}\n`);
  }
  
  try {
    console.log('4. Updating draft status for steps...');
    await tursoDb.execute('UPDATE steps SET draft = (SELECT sequences.draft FROM sequences WHERE sequences.id = steps.sequence_id)');
    console.log('✅ Success\n');
  } catch (error) {
    console.log(`❌ ${error.message}\n`);
  }
  
  // Verify
  console.log('=== VERIFICATION ===\n');
  const seqInfo = await tursoDb.execute('PRAGMA table_info(sequences)');
  console.log('Sequences columns:', seqInfo.rows.map(r => r.name).join(', '));
  
  const stepInfo = await tursoDb.execute('PRAGMA table_info(steps)');
  console.log('Steps columns:', stepInfo.rows.map(r => r.name).join(', '));
  
  const publishedCount = await tursoDb.execute('SELECT COUNT(*) as count FROM sequences WHERE draft = 0 AND is_published_version = 1');
  console.log(`\nPublished sequences: ${publishedCount.rows[0].count}`);
  
  console.log('\n✅ Done!');
}

runMissingStatements().catch(console.error);
