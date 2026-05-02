// add_brainparts_from_instructions31.js
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const brainpartsToAdd = [
"inferior_semi_lunar_lobule",
"cerebellar_tonsil",
"inferior_temporal_gyrus",
"uncus",
"middle_temporal_gyrus",
"superior_temporal_gyrus",
"sub_gyral",
"pyramis",
"uvula",
"uvula_of_vermis",
"fourth_ventricle",
"tuber",
"pyramis_of_vermis",
"nodule",
"culmen",
"orbital_gyrus",
"tuber_of_vermis",
"fusiform_gyrus",
"parahippocampal_gyrus",
"rectal_gyrus",
"superior_frontal_gyrus",
"declive",
"declive_of_vermis",
"fastigium",
"lateral_ventricle",
"inferior_frontal_gyrus",
"middle_frontal_gyrus",
"cerebellar_lingual",
"medial_frontal_gyrus",
"lingual_gyrus",
"inferior_occipital_gyrus",
"subcallosal_gyrus",
"middle_occipital_gyrus",
"culmen_of_vermis",
"extra_nuclear",
"caudate",
"third_ventricle",
"anterior_cingulate",
"lentiform_nucleus",
"thalamus",
"insula",
"claustrum",
"cuneus",
"posterior_cingulate",
"precentral_gyrus",
"transverse_temporal_gyrus",
"postcentral_gyrus",
"precuneus",
"superior_occipital_gyrus",
"supramarginal_gyrus",
"inferior_parietal_lobule",
"cingulate_gyrus",
"angular_gyrus",
"superior_parietal_lobule",
"paracentral_lobule",
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
