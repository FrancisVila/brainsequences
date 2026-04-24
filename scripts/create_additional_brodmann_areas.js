// create_additional_brodmann_areas.js
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const brodmannAreasToCreate = [
  'Brodmann Area 12',
  'Brodmann Area 14',
  'Brodmann Area 15',
  'Brodmann Area 16',
  'Brodmann Area 26',
  'Brodmann Area 34'
];

async function createBrodmannAreas() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log('Creating new Brodmann areas...\n');

  let created = 0;
  let skipped = 0;

  for (const title of brodmannAreasToCreate) {
    // Check if brainpart already exists
    const existing = await db.execute({
      sql: 'SELECT id FROM brainparts WHERE title = ?',
      args: [title]
    });

    if (existing.rows.length > 0) {
      console.log(`⏭️  Skipped (already exists): ${title}`);
      skipped++;
    } else {
      // Create the brainpart with version=2, visible=1, and is_part_of=490
      const result = await db.execute({
        sql: 'INSERT INTO brainparts (title, version, visible, is_part_of) VALUES (?, 2, 1, 490)',
        args: [title]
      });
      console.log(`✅ Created: ${title} (id: ${result.lastInsertRowid})`);
      created++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${brodmannAreasToCreate.length}`);
}

createBrodmannAreas().catch(console.error);
