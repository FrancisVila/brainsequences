// delete_lowercase_brodmann_areas.js
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function deleteLowestcaseBrodmannAreas() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log('Fetching all brainparts starting with lowercase "brodmann_area_"...\n');

  // First, fetch all matching brainparts to show what will be deleted
  const fetchResult = await db.execute({
    sql: `SELECT id, title FROM brainparts 
          WHERE title LIKE 'brodmann_area_%'
          ORDER BY title`,
    args: []
  });

  if (fetchResult.rows.length === 0) {
    console.log('ℹ️  No brainparts starting with "brodmann_area_" found.');
    return;
  }

  console.log(`Found ${fetchResult.rows.length} brainparts to delete:\n`);
  for (const row of fetchResult.rows) {
    console.log(`  - ${row.title} (id: ${row.id})`);
  }

  console.log(`\n✅ Deleting all brainparts starting with "brodmann_area_"...\n`);

  // Delete all brainparts starting with lowercase "brodmann_area_"
  const deleteResult = await db.execute({
    sql: `DELETE FROM brainparts WHERE title LIKE 'brodmann_area_%'`,
    args: []
  });

  console.log(`✅ Successfully deleted ${fetchResult.rows.length} brainparts`);

  console.log('\nVerifying remaining Brodmann areas...\n');
  
  // Verify remaining brainparts with "Brodmann Area"
  const verifyResult = await db.execute({
    sql: `SELECT id, title FROM brainparts 
          WHERE title LIKE 'Brodmann%'
          ORDER BY title`,
    args: []
  });

  console.log(`Remaining brainparts with "Brodmann":\n`);
  for (const row of verifyResult.rows) {
    console.log(`  - ${row.title} (id: ${row.id})`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Deleted: ${fetchResult.rows.length} lowercase "brodmann_area_" entries`);
  console.log(`   Kept: ${verifyResult.rows.length} "Brodmann Area" entries`);
}

deleteLowestcaseBrodmannAreas().catch(console.error);
