// manage_brodmann_areas_64.js
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function manageBrodmannAreas() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log('Deleting all brainparts with title starting with "brodmann_area_"...\n');

  // Delete all brainparts with title starting with "Brodmann Area"
  const deleteResult = await db.execute({
    sql: `DELETE FROM brainparts WHERE LOWER(title) LIKE 'brodmann area%' AND LOWER(title) != 'brodmann areas'`,
    args: []
  });

  console.log(`✅ Deleted: ${deleteResult.rows?.length || 'multiple'} brainparts starting with "Brodmann Area"`);

  console.log('\nCreating brainpart with title="Brodman Area 16"...\n');

  // Create new brainpart with title "Brodman Area 16"
  const insertResult = await db.execute({
    sql: 'INSERT INTO brainparts (title, visible) VALUES (?, 1)',
    args: ['Brodman Area 16']
  });

  console.log(`✅ Created: Brodman Area 16 (id: ${insertResult.lastInsertRowid})`);

  console.log('\n📊 Summary:');
  console.log(`   Deleted: All "Brodmann Area" entries (except parent)`);
  console.log(`   Created: Brodman Area 16`);
}

manageBrodmannAreas().catch(console.error);
