// reverse_brodmann_areas_64.js
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const brainpartsToRestore = [
  'brodmann_area_10',
  'brodmann_area_11',
  'brodmann_area_13',
  'brodmann_area_17',
  'brodmann_area_18',
  'brodmann_area_19',
  'brodmann_area_1',
  'brodmann_area_20',
  'brodmann_area_21',
  'brodmann_area_22',
  'brodmann_area_23',
  'brodmann_area_24',
  'brodmann_area_25',
  'brodmann_area_27',
  'brodmann_area_28',
  'brodmann_area_29',
  'brodmann_area_2',
  'brodmann_area_30',
  'brodmann_area_31',
  'brodmann_area_32',
  'brodmann_area_33',
  'brodmann_area_35',
  'brodmann_area_36',
  'brodmann_area_37',
  'brodmann_area_38',
  'brodmann_area_39',
  'brodmann_area_3',
  'brodmann_area_40',
  'brodmann_area_41',
  'brodmann_area_42',
  'brodmann_area_43',
  'brodmann_area_44',
  'brodmann_area_45',
  'brodmann_area_46',
  'brodmann_area_47',
  'brodmann_area_4',
  'brodmann_area_5',
  'brodmann_area_6',
  'brodmann_area_7',
  'brodmann_area_8',
  'brodmann_area_9'
];

// Convert underscore names to proper titles
function toTitle(str) {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function reverseBrodmannAreas() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log('Reversing instruction 64 actions...\n');

  // Delete "Brodman Area 16"
  console.log('Step 1: Deleting "Brodman Area 16"...\n');
  const deleteResult = await db.execute({
    sql: `DELETE FROM brainparts WHERE title = ?`,
    args: ['Brodman Area 16']
  });
  console.log(`✅ Deleted: Brodman Area 16`);

  // Recreate all Brodmann areas with is_part_of = 365
  console.log('\nStep 2: Recreating all Brodmann areas with is_part_of = 365...\n');

  let restored = 0;

  for (const brainpart of brainpartsToRestore) {
    const title = toTitle(brainpart);
    
    // Check if brainpart already exists
    const existing = await db.execute({
      sql: 'SELECT id FROM brainparts WHERE title = ?',
      args: [title]
    });

    if (existing.rows.length === 0) {
      // Create the brainpart with version=2 and is_part_of=365
      const result = await db.execute({
        sql: 'INSERT INTO brainparts (title, version, visible, is_part_of) VALUES (?, 2, 1, 365)',
        args: [title]
      });
      console.log(`✅ Restored: ${title} (id: ${result.lastInsertRowid})`);
      restored++;
    } else {
      console.log(`ℹ️  Already exists: ${title}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Deleted: Brodman Area 16`);
  console.log(`   Restored: ${restored} Brodmann areas`);
  console.log(`   Total restored: ${brainpartsToRestore.length}`);
}

reverseBrodmannAreas().catch(console.error);
