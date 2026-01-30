import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const tursoDb = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function checkSchema() {
  console.log('Checking production Turso schema...\n');
  console.log('Database URL:', process.env.DATABASE_URL);
  console.log();
  
  try {
    // Check sequences table
    const seqInfo = await tursoDb.execute('PRAGMA table_info(sequences)');
    console.log('=== SEQUENCES TABLE COLUMNS ===');
    seqInfo.rows.forEach(row => {
      console.log(`- ${row.name} (${row.type})`);
    });
    
    const requiredColumns = ['published_version_id', 'is_published_version', 'currently_edited_by', 'last_edited_at'];
    console.log('\nRequired columns check:');
    requiredColumns.forEach(col => {
      const exists = seqInfo.rows.some(row => row.name === col);
      console.log(`${exists ? '✅' : '❌'} ${col}`);
    });
    
    // Check steps table
    const stepInfo = await tursoDb.execute('PRAGMA table_info(steps)');
    console.log('\n=== STEPS TABLE COLUMNS ===');
    stepInfo.rows.forEach(row => {
      console.log(`- ${row.name} (${row.type})`);
    });
    
    const hasDraft = stepInfo.rows.some(row => row.name === 'draft');
    console.log('\nRequired columns check:');
    console.log(`${hasDraft ? '✅' : '❌'} draft`);
    
    // Check data
    console.log('\n=== DATA CHECK ===');
    const seqCount = await tursoDb.execute('SELECT COUNT(*) as count FROM sequences');
    console.log(`Total sequences: ${seqCount.rows[0].count}`);
    
    const publishedCount = await tursoDb.execute('SELECT COUNT(*) as count FROM sequences WHERE draft = 0 AND is_published_version = 1');
    console.log(`Published sequences: ${publishedCount.rows[0].count}`);
    
    const stepCount = await tursoDb.execute('SELECT COUNT(*) as count FROM steps');
    console.log(`Total steps: ${stepCount.rows[0].count}`);
    
    console.log('\n✅ Schema check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nThe migration may not have been applied to production.');
    console.error('Run: node scripts/complete_turso_migration.js');
  }
}

checkSchema().catch(console.error);
