// set_brodmann_areas_is_part_of_490.js
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function setBrodmannAreasIsPartOf() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log('Setting is_part_of = 490 for all Brodmann Area entries...\n');

  // Update all individual Brodmann Area entries (not the parent)
  const updateResult = await db.execute({
    sql: `UPDATE brainparts 
          SET is_part_of = 490 
          WHERE title LIKE 'Brodmann Area %' AND title != 'Brodmann Areas'`,
    args: []
  });

  console.log(`✅ Updated individual Brodmann Areas to is_part_of = 490`);

  // Verify the parent
  const parentCheck = await db.execute({
    sql: `SELECT id, title, is_part_of FROM brainparts WHERE title = 'Brodmann Areas'`,
    args: []
  });

  if (parentCheck.rows.length > 0) {
    const parent = parentCheck.rows[0];
    console.log(`\n✅ Parent "Brodmann Areas" (id: ${parent.id}) is_part_of = ${parent.is_part_of}`);
  }

  // Verify the changes
  console.log('\n📋 Verification:\n');

  const verify = await db.execute({
    sql: `SELECT title, is_part_of FROM brainparts 
          WHERE title LIKE 'Brodmann Area%'
          ORDER BY title`,
    args: []
  });

  let individualCount = 0;
  let parentCount = 0;

  for (const row of verify.rows) {
    console.log(`  - ${row.title}: is_part_of = ${row.is_part_of}`);
    if (row.title === 'Brodmann Areas') {
      parentCount++;
    } else {
      individualCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Individual Brodmann Areas: ${individualCount} (is_part_of = 490)`);
  console.log(`   Parent "Brodmann Areas": ${parentCount}`);
  console.log(`   Total: ${verify.rows.length}`);
}

setBrodmannAreasIsPartOf().catch(console.error);
