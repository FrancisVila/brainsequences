// add_brainparts_from_instructions31.js
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const brainpartsToAdd = [
"angular_gyrus",
"anterior_cingulate",
"caudate",
"cerebellar_lingual",
"cerebellar_tonsil",
"cingulate_gyrus",
"claustrum",
"culmen",
"culmen_of_vermis",
"cuneus",
"declive",
"declive_of_vermis",
"extra_nuclear",
"fastigium",
"fourth_ventricle",
"fusiform_gyrus",
"inferior_frontal_gyrus",
"inferior_occipital_gyrus",
"inferior_parietal_lobule",
"inferior_semi_lunar_lobule",
"inferior_temporal_gyrus",
"insula",
"lateral_ventricle",
"lentiform_nucleus",
"lingual_gyrus",
"medial_frontal_gyrus",
"middle_frontal_gyrus",
"middle_occipital_gyrus",
"middle_temporal_gyrus",
"nodule",
"orbital_gyrus",
"paracentral_lobule",
"parahippocampal_gyrus",
"postcentral_gyrus",
"posterior_cingulate",
"precentral_gyrus",
"precuneus",
"pyramis",
"pyramis_of_vermis",
"rectal_gyrus",
"subcallosal_gyrus",
"sub_gyral",
"superior_frontal_gyrus",
"superior_occipital_gyrus",
"superior_parietal_lobule",
"superior_temporal_gyrus",
"supramarginal_gyrus",
"thalamus",
"third_ventricle",
"transverse_temporal_gyrus",
"tuber",
"tuber_of_vermis",
"uncus",
"uvula",
"uvula_of_vermis"
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
    
    // Check if brainpart already exists in version 2
    const existing = await db.execute({
      sql: 'SELECT id FROM brainparts WHERE title = ? AND version = 2',
      args: [title]
    });

    if (existing.rows.length > 0) {
      console.log(`⏭️  Skipped (already exists in version 2): ${title}`);
      skipped++;
    } else {
      // Insert the brainpart with version 2
      await db.execute({
        sql: 'INSERT INTO brainparts (title, visible, version) VALUES (?, 1, 2)',
        args: [title]
      });
      console.log(`✅ Added: ${title} (version 2)`);
      added++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Added: ${added}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${brainpartsToAdd.length}`);
}

addBrainparts().catch(console.error);
