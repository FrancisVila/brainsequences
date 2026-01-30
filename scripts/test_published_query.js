import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const tursoDb = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function testQuery() {
  console.log('Testing the published sequences query...\n');
  
  try {
    // Test the exact query that's failing
    const result = await tursoDb.execute(`
      SELECT id, title, description, user_id, draft, published_version_id, 
             is_published_version, currently_edited_by, last_edited_at, created_at 
      FROM sequences 
      WHERE draft = 0 AND is_published_version = 1 
      ORDER BY id
    `);
    
    console.log('✅ Query executed successfully!');
    console.log(`Found ${result.rows.length} published sequences:\n`);
    
    result.rows.forEach(row => {
      console.log(`- ID ${row.id}: ${row.title} (draft=${row.draft}, is_published_version=${row.is_published_version})`);
    });
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('\nFull error:', error);
  }
}

testQuery().catch(console.error);
