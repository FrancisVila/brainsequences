// fix_brodmann_areas_case_sensitive.js
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uppercaseBrodmannAreas = [
  'Brodmann Area 1',
  'Brodmann Area 2',
  'Brodmann Area 3',
  'Brodmann Area 4',
  'Brodmann Area 5',
  'Brodmann Area 6',
  'Brodmann Area 7',
  'Brodmann Area 8',
  'Brodmann Area 9',
  'Brodmann Area 10',
  'Brodmann Area 11',
  'Brodmann Area 13',
  'Brodmann Area 17',
  'Brodmann Area 18',
  'Brodmann Area 19',
  'Brodmann Area 20',
  'Brodmann Area 21',
  'Brodmann Area 22',
  'Brodmann Area 23',
  'Brodmann Area 24',
  'Brodmann Area 25',
  'Brodmann Area 27',
  'Brodmann Area 28',
  'Brodmann Area 29',
  'Brodmann Area 30',
  'Brodmann Area 31',
  'Brodmann Area 32',
  'Brodmann Area 33',
  'Brodmann Area 35',
  'Brodmann Area 36',
  'Brodmann Area 37',
  'Brodmann Area 38',
  'Brodmann Area 39',
  'Brodmann Area 40',
  'Brodmann Area 41',
  'Brodmann Area 42',
  'Brodmann Area 43',
  'Brodmann Area 44',
  'Brodmann Area 45',
  'Brodmann Area 46',
  'Brodmann Area 47'
];

async function fixBrodmannAreas() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log('Restoring uppercase "Brodmann Area" entries and deleting only lowercase "brodmann_area_"...\n');

  // Step 1: Restore uppercase Brodmann Areas
  console.log('Step 1: Restoring uppercase "Brodmann Area" entries...\n');

  let restored = 0;
  for (const title of uppercaseBrodmannAreas) {
    // Check if already exists
    const existing = await db.execute({
      sql: 'SELECT id FROM brainparts WHERE title = ?',
      args: [title]
    });

    if (existing.rows.length === 0) {
      // Create it with version=2 and is_part_of=365
      const result = await db.execute({
        sql: 'INSERT INTO brainparts (title, version, visible, is_part_of) VALUES (?, 2, 1, 365)',
        args: [title]
      });
      console.log(`✅ Restored: ${title} (id: ${result.lastInsertRowid})`);
      restored++;
    }
  }

  // Step 2: Restore Brodmann Areas parent if it doesn't exist
  console.log('\nStep 2: Checking parent "Brodmann Areas"...\n');
  const parent = await db.execute({
    sql: 'SELECT id FROM brainparts WHERE title = ?',
    args: ['Brodmann Areas']
  });

  if (parent.rows.length === 0) {
    const result = await db.execute({
      sql: 'INSERT INTO brainparts (title, version, visible, is_part_of) VALUES (?, 2, 1, -1)',
      args: ['Brodmann Areas']
    });
    console.log(`✅ Restored: Brodmann Areas (id: ${result.lastInsertRowid})`);
    restored++;
  } else {
    console.log(`ℹ️  Brodmann Areas already exists (id: ${parent.rows[0].id})`);
  }

  // Step 3: Delete lowercase "brodmann_area_" entries using GLOB for case-sensitive matching
  console.log('\nStep 3: Deleting lowercase "brodmann_area_" entries...\n');

  const toDelete = await db.execute({
    sql: `SELECT id, title FROM brainparts 
          WHERE title GLOB 'brodmann_area_*'
          ORDER BY title`,
    args: []
  });

  console.log(`Found ${toDelete.rows.length} lowercase entries to delete:\n`);
  for (const row of toDelete.rows) {
    console.log(`  - ${row.title} (id: ${row.id})`);
  }

  if (toDelete.rows.length > 0) {
    console.log('\n✅ Deleting lowercase entries...\n');
    const deleteResult = await db.execute({
      sql: `DELETE FROM brainparts WHERE title GLOB 'brodmann_area_*'`,
      args: []
    });
    console.log(`✅ Deleted ${toDelete.rows.length} lowercase "brodmann_area_" entries`);
  }

  // Verify final state
  console.log('\n📋 Final verification:\n');
  const final = await db.execute({
    sql: `SELECT id, title FROM brainparts 
          WHERE title LIKE '%Brodmann%'
          ORDER BY title`,
    args: []
  });

  console.log(`Remaining "Brodmann" entries: ${final.rows.length}\n`);
  for (const row of final.rows) {
    console.log(`  - ${row.title} (id: ${row.id})`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Restored: ${restored}`);
  console.log(`   Deleted: ${toDelete.rows.length}`);
  console.log(`   Final count: ${final.rows.length}`);
}

fixBrodmannAreas().catch(console.error);
