/**
 * Script to create version 2 brainparts from SVG filenames in
 * C:\projects\brainsequences\brainsequences-py\output\talairach_lobe_svg
 *
 * Each filename (without .svg extension) becomes a brainpart title,
 * with spaces and non-alphanumeric characters replaced by '_'.
 * All inserted brainparts get version = 2.
 */

import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const tursoUrl = process.env.DATABASE_URL;
const tursoAuthToken = process.env.DATABASE_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
  console.error('❌ Missing Turso credentials in .env file');
  console.error('Required: DATABASE_URL and DATABASE_AUTH_TOKEN');
  process.exit(1);
}

const tursoDb = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

const SVG_FOLDER = 'C:\\projects\\brainsequences\\brainsequences-py\\output\\talairach_lobe_svg';

function toTitle(filename) {
  // Remove extension
  const base = filename.replace(/\.[^.]+$/, '');
  // Replace spaces and non-alphanumeric characters with '_'
  return base.replace(/[^a-zA-Z0-9]/g, '_');
}

async function main() {
  console.log(`Reading SVG files from: ${SVG_FOLDER}\n`);

  const files = fs.readdirSync(SVG_FOLDER).filter(f => f.endsWith('.svg'));
  console.log(`Found ${files.length} SVG files\n`);

  let inserted = 0;
  let skipped = 0;

  for (const file of files) {
    const title = toTitle(file);

    // Check if a version-2 brainpart with this title already exists
    const existing = await tursoDb.execute({
      sql: 'SELECT id FROM brainparts WHERE title = ? AND version = 2',
      args: [title],
    });

    if (existing.rows.length > 0) {
      console.log(`⚠️  Skipping (already exists): ${title}`);
      skipped++;
      continue;
    }

    await tursoDb.execute({
      sql: 'INSERT INTO brainparts (title, version, visible) VALUES (?, 2, 1)',
      args: [title],
    });

    console.log(`✅ Inserted: ${title}`);
    inserted++;
  }

  console.log(`\n=== DONE ===`);
  console.log(`Inserted: ${inserted}, Skipped: ${skipped}, Total files: ${files.length}`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
