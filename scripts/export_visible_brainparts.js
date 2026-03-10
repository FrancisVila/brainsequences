import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function exportVisibleBrainparts() {
  try {
    console.log('Querying database for visible brainparts...');
    
    const result = await client.execute({
      sql: 'SELECT title FROM brainparts WHERE visible = 1 ORDER BY title',
      args: [],
    });

    console.log(`Found ${result.rows.length} visible brainparts`);

    // Extract titles
    const titles = result.rows.map(row => row.title);

    // Save to brainparts_visible.txt
    const outputPath = path.join(process.cwd(), 'brainparts_visible.txt');
    fs.writeFileSync(outputPath, titles.join('\n'), 'utf8');

    console.log(`✅ Saved to ${outputPath}`);
    console.log(`Total: ${titles.length} brainparts`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

exportVisibleBrainparts();
