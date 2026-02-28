// Check current is_part_of values in Turso database
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkBrainpartRelationships() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log('🔍 Checking brainpart relationships in database...\n');

  // Get all brainparts
  const result = await db.execute({
    sql: 'SELECT id, title, is_part_of FROM brainparts ORDER BY title'
  });

  console.log(`Total brainparts: ${result.rows.length}\n`);

  // Group by is_part_of value
  const byIsPartOf = new Map();
  
  for (const row of result.rows) {
    const value = row.is_part_of === null ? 'null' : row.is_part_of;
    if (!byIsPartOf.has(value)) {
      byIsPartOf.set(value, []);
    }
    byIsPartOf.get(value).push(row.title);
  }

  console.log('📊 Grouping by is_part_of value:\n');
  
  // Sort keys
  const sortedKeys = Array.from(byIsPartOf.keys()).sort((a, b) => {
    if (a === 'null') return 1;
    if (b === 'null') return -1;
    return Number(a) - Number(b);
  });

  for (const key of sortedKeys) {
    const items = byIsPartOf.get(key);
    console.log(`is_part_of = ${key}: (${items.length} brainparts)`);
    items.slice(0, 5).forEach(title => console.log(`  - ${title}`));
    if (items.length > 5) {
      console.log(`  ... and ${items.length - 5} more`);
    }
    console.log();
  }

  // Check parent regions specifically
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

  console.log('🧠 Parent regions status:\n');
  for (const region of parentRegions) {
    const row = result.rows.find(r => r.title === region);
    if (row) {
      console.log(`${region} (ID: ${row.id}): is_part_of = ${row.is_part_of}`);
    } else {
      console.log(`${region}: NOT FOUND`);
    }
  }
}

checkBrainpartRelationships().catch(console.error);
