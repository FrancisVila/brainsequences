// set_brodmann_areas_is_part_of.js
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const brainpartsToUpdate = [
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

async function updateBrodmannAreas() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log('Adding Brodmann areas (if missing) and setting is_part_of to 365...\n');

  let added = 0;
  let updated = 0;
  let alreadySet = 0;

  for (const brainpart of brainpartsToUpdate) {
    const title = toTitle(brainpart);
    
    // Check if brainpart exists
    const existing = await db.execute({
      sql: 'SELECT id, is_part_of FROM brainparts WHERE title = ?',
      args: [title]
    });

    if (existing.rows.length === 0) {
      // Create the brainpart with version=2
      const result = await db.execute({
        sql: 'INSERT INTO brainparts (title, version, visible, is_part_of) VALUES (?, 2, 1, 365)',
        args: [title]
      });
      console.log(`✅ Added and set: ${title} (id: ${result.lastInsertRowid}) is_part_of = 365`);
      added++;
    } else {
      const brainpartId = existing.rows[0].id;
      const currentIsPartOf = existing.rows[0].is_part_of;
      
      if (currentIsPartOf === 365) {
        console.log(`ℹ️  Already set: ${title} (id: ${brainpartId}) is_part_of = 365`);
        alreadySet++;
      } else {
        // Update is_part_of to 365
        await db.execute({
          sql: 'UPDATE brainparts SET is_part_of = 365 WHERE id = ?',
          args: [brainpartId]
        });
        console.log(`✅ Updated: ${title} (id: ${brainpartId}) is_part_of = 365`);
        updated++;
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Added: ${added}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Already set: ${alreadySet}`);
  console.log(`   Total: ${brainpartsToUpdate.length}`);
}

updateBrodmannAreas().catch(console.error);
