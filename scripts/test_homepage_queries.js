import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const tursoDb = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function testQueries() {
  console.log('Testing all queries used on homepage...\n');
  
  try {
    // Test 1: getPublishedSequences
    console.log('1. Testing getPublishedSequences...');
    const published = await tursoDb.execute(`
      SELECT * FROM sequences 
      WHERE draft = 0 AND is_published_version = 1 
      ORDER BY id
    `);
    console.log(`✅ Found ${published.rows.length} published sequences\n`);
    
    // Test 2: getMySequences (for user_id = 1)
    console.log('2. Testing getMySequences for user_id = 1...');
    const owned = await tursoDb.execute(`
      SELECT * FROM sequences 
      WHERE user_id = 1 
      ORDER BY id
    `);
    console.log(`✅ Found ${owned.rows.length} owned sequences\n`);
    
    // Test 3: Check for any sequences with NULL in new columns
    console.log('3. Checking for NULL values in new columns...');
    const nullCheck = await tursoDb.execute(`
      SELECT id, title, 
             published_version_id, 
             is_published_version, 
             currently_edited_by, 
             last_edited_at 
      FROM sequences
    `);
    
    nullCheck.rows.forEach(row => {
      console.log(`ID ${row.id}: is_published_version=${row.is_published_version}, published_version_id=${row.published_version_id}`);
    });
    
    console.log('\n✅ All queries work!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nStack:', error.stack);
  }
}

testQueries().catch(console.error);
