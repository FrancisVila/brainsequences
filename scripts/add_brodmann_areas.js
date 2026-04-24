// add_brodmann_areas.js
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const brainpartsToAdd = [
  'brodmann_area_12',
  'brodmann_area_14',
  'brodmann_area_15',
  'brodmann_area_26',
  'brodmann_area_34',
  'brodmann_areas'
];

// Convert underscore names to proper titles
function toTitle(str) {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function addBrodmannAreas() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log('Adding Brodmann areas to database...\n');

  let added = 0;
  let skipped = 0;
  let brodmannAreasId = null;

  // First, add all brainparts with version=2
  for (const brainpart of brainpartsToAdd) {
    const title = toTitle(brainpart);
    
    // Check if brainpart already exists
    const existing = await db.execute({
      sql: 'SELECT id FROM brainparts WHERE title = ?',
      args: [title]
    });

    if (existing.rows.length > 0) {
      console.log(`⏭️  Skipped (already exists): ${title}`);
      skipped++;
      // Store the ID of brodmann_areas for later use
      if (brainpart === 'brodmann_areas') {
        brodmannAreasId = existing.rows[0].id;
      }
    } else {
      // Insert the brainpart with version=2
      const result = await db.execute({
        sql: 'INSERT INTO brainparts (title, version, visible) VALUES (?, 2, 1)',
        args: [title]
      });
      console.log(`✅ Added: ${title} (id: ${result.lastInsertRowid})`);
      added++;
      
      // Store the ID of brodmann_areas for later use
      if (brainpart === 'brodmann_areas') {
        brodmannAreasId = result.lastInsertRowid;
      }
    }
  }

  console.log(`\n📋 Setting is_part_of relationships...\n`);

  // Set brodmann_areas.is_part_of to -1
  if (brodmannAreasId) {
    await db.execute({
      sql: 'UPDATE brainparts SET is_part_of = -1 WHERE id = ?',
      args: [brodmannAreasId]
    });
    console.log(`✅ Set brodmann_areas (id: ${brodmannAreasId}) is_part_of to -1`);

    // Set all brodmann_area_* brainparts' is_part_of to brodmannAreasId
    for (const brainpart of brainpartsToAdd) {
      if (brainpart.startsWith('brodmann_area_') && brainpart !== 'brodmann_areas') {
        const title = toTitle(brainpart);
        await db.execute({
          sql: 'UPDATE brainparts SET is_part_of = ? WHERE title = ?',
          args: [brodmannAreasId, title]
        });
        console.log(`✅ Set ${title} is_part_of to ${brodmannAreasId}`);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Added: ${added}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${brainpartsToAdd.length}`);
}

addBrodmannAreas().catch(console.error);
