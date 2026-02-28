// Update parent brain regions to have is_part_of = -1
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Parent regions that should have is_part_of = -1
const parentRegions = [
  'Frontal lobe',
  'Parietal lobe',
  'Temporal lobe',
  'Occipital lobe',
  'Limbic system',
  'Endocrine system',
  'Senses',
  'Brain stem'
];

async function updateParentRegions() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log('🧠 Updating parent brain regions to is_part_of = -1...\n');

  let updated = 0;
  let skipped = 0;

  for (const region of parentRegions) {
    // Get current is_part_of value
    const result = await db.execute({
      sql: 'SELECT id, is_part_of FROM brainparts WHERE title = ?',
      args: [region]
    });

    if (result.rows.length === 0) {
      console.log(`❌ Not found: ${region}`);
      continue;
    }

    const brainpart = result.rows[0];
    const currentValue = brainpart.is_part_of;

    if (currentValue === -1) {
      console.log(`⏭️  Already set: ${region} (is_part_of = -1)`);
      skipped++;
    } else {
      await db.execute({
        sql: 'UPDATE brainparts SET is_part_of = -1 WHERE id = ?',
        args: [brainpart.id]
      });
      console.log(`✅ Updated: ${region} (was: ${currentValue}, now: -1)`);
      updated++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped (already -1): ${skipped}`);
  console.log(`   Total: ${parentRegions.length}`);
}

updateParentRegions().catch(console.error);
