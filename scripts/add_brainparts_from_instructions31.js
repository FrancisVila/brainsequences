// add_brainparts_from_instructions31.js
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const brainpartsToAdd = [
  'touch',
  'motor_hip',
  'sensory_mouth',
  'motor_larynx',
  'sensory_eye',
  'motor_fingers',
  'motor_face',
  'motor_ankle',
  'motor_thumb',
  'motor_brow',
  'sensory_fingers',
  'sensory_foot',
  'sensory_head',
  'sensory_leg',
  'sensory_genitalia',
  'motor_neck',
  'motor_knee',
  'sensory_neck',
  'motor_lips',
  'sensory_lips',
  'sensory_thumb',
  'motor_trunk',
  'motor_shoulder',
  'motor_wrist',
  'motor_tongue',
  'motor_toes',
  'sensory_area',
  'central_Sulcus',
  'Temporal_Pole'
];

// Convert underscore names to proper titles
function toTitle(str) {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function addBrainparts() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log('Adding brainparts to database...\n');

  let added = 0;
  let skipped = 0;

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
    } else {
      // Insert the brainpart
      await db.execute({
        sql: 'INSERT INTO brainparts (title, visible) VALUES (?, 1)',
        args: [title]
      });
      console.log(`✅ Added: ${title}`);
      added++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Added: ${added}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${brainpartsToAdd.length}`);
}

addBrainparts().catch(console.error);
