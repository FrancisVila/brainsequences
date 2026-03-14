// Move Motor brainparts under Precentral_gyrus (id 157)
// Move Sensory brainparts under Postcentral_gyrus (id 156)
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function moveBrainparts() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  // Preview what will be changed
  const motorParts = await db.execute({
    sql: "SELECT id, title, is_part_of FROM brainparts WHERE title LIKE 'Motor%' ORDER BY title"
  });
  console.log(`\n🔵 Brainparts starting with 'Motor' (${motorParts.rows.length}) → will be set to is_part_of = 157 (Precentral_gyrus):`);
  motorParts.rows.forEach(r => console.log(`  [${r.id}] ${r.title}  (was: ${r.is_part_of})`));

  const sensoryParts = await db.execute({
    sql: "SELECT id, title, is_part_of FROM brainparts WHERE title LIKE 'Sensory%' ORDER BY title"
  });
  console.log(`\n🟢 Brainparts starting with 'Sensory' (${sensoryParts.rows.length}) → will be set to is_part_of = 156 (Postcentral_gyrus):`);
  sensoryParts.rows.forEach(r => console.log(`  [${r.id}] ${r.title}  (was: ${r.is_part_of})`));

  if (motorParts.rows.length === 0 && sensoryParts.rows.length === 0) {
    console.log('\n⚠️  Nothing to update.');
    return;
  }

  // Apply updates
  const motorResult = await db.execute({
    sql: "UPDATE brainparts SET is_part_of = 157 WHERE title LIKE 'Motor%'",
  });
  console.log(`\n✅ Updated ${motorResult.rowsAffected} Motor brainparts → is_part_of = 157`);

  const sensoryResult = await db.execute({
    sql: "UPDATE brainparts SET is_part_of = 156 WHERE title LIKE 'Sensory%'",
  });
  console.log(`✅ Updated ${sensoryResult.rowsAffected} Sensory brainparts → is_part_of = 156`);

  console.log('\nDone.');
}

moveBrainparts().catch(console.error);
