import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const tursoDb = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function checkColumnNames() {
  console.log('Checking exact column names in production database...\n');
  
  try {
    const seqInfo = await tursoDb.execute('PRAGMA table_info(sequences)');
    
    console.log('=== SEQUENCES TABLE COLUMNS ===');
    seqInfo.rows.forEach(row => {
      console.log(`${row.cid}: ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : 'NULL'} ${row.dflt_value ? 'DEFAULT ' + row.dflt_value : ''}`);
    });
    
    console.log('\n=== CHECKING SPECIFIC COLUMNS ===');
    const columnsToCheck = [
      'draft',
      'is_published_version',
      'published_version_id', 
      'currently_edited_by',
      'last_edited_at'
    ];
    
    columnsToCheck.forEach(col => {
      const exists = seqInfo.rows.some(row => row.name === col);
      console.log(`${exists ? '✅' : '❌'} ${col}`);
    });
    
    // Try a simple select to see what columns Drizzle is trying to use
    console.log('\n=== SAMPLE DATA ===');
    const sample = await tursoDb.execute('SELECT * FROM sequences LIMIT 1');
    if (sample.rows.length > 0) {
      console.log('Columns returned:', sample.columns);
      console.log('Sample row:', sample.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkColumnNames().catch(console.error);
