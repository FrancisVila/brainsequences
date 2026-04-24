// list_brodmann_areas.js
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function listBrodmannAreas() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log('Fetching all brainparts starting with "brodmann_area"...\n');

  const result = await db.execute({
    sql: `SELECT id, title, version, visible, is_part_of FROM brainparts 
          WHERE LOWER(title) LIKE 'brodmann area%' 
          ORDER BY title`,
    args: []
  });

  console.log(`Found ${result.rows.length} brainparts:\n`);
  console.log('ID'.padEnd(5) + 'Title'.padEnd(30) + 'Version'.padEnd(10) + 'Visible'.padEnd(10) + 'is_part_of');
  console.log('-'.repeat(75));

  for (const row of result.rows) {
    console.log(
      String(row.id).padEnd(5) + 
      row.title.padEnd(30) + 
      String(row.version || 'null').padEnd(10) + 
      String(row.visible).padEnd(10) + 
      String(row.is_part_of)
    );
  }
}

listBrodmannAreas().catch(console.error);
