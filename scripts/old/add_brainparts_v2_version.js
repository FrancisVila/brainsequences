/**
 * Script to add brainparts with version=2 to Turso database
 */

import { createClient } from '@libsql/client';
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

// List of brainpart labels to add
const labels = [
  'amygdala',
  'brodmann_area_10',
  'brodmann_area_11',
  'brodmann_area_13',
  'brodmann_area_17',
  'brodmann_area_18',
  'brodmann_area_19',
  'brodmann_area_1',
  'brodmann_area_20',
  'brodmann_area_21',
  'brodmann_area_22',
  'brodmann_area_23',
  'brodmann_area_24',
  'brodmann_area_25',
  'brodmann_area_27',
  'brodmann_area_28',
  'brodmann_area_29',
  'brodmann_area_2',
  'brodmann_area_30',
  'brodmann_area_31',
  'brodmann_area_32',
  'brodmann_area_33',
  'brodmann_area_35',
  'brodmann_area_36',
  'brodmann_area_37',
  'brodmann_area_38',
  'brodmann_area_39',
  'brodmann_area_3',
  'brodmann_area_40',
  'brodmann_area_41',
  'brodmann_area_42',
  'brodmann_area_43',
  'brodmann_area_44',
  'brodmann_area_45',
  'brodmann_area_46',
  'brodmann_area_47',
  'brodmann_area_4',
  'brodmann_area_5',
  'brodmann_area_6',
  'brodmann_area_7',
  'brodmann_area_8',
  'brodmann_area_9',
  'caudate_body',
  'caudate_head',
  'caudate_tail',
  'corpus_callosum',
  'dentate',
  'dir.txt',
  'hippocampus',
  'hypothalamus',
  'lateral_globus_pallidus',
  'lateral_posterior_nucleus',
  'mammillary_body',
  'medial_dorsal_nucleus',
  'medial_geniculum_body',
  'optic_tract',
  'pulvinar',
  'putamen',
  'red_nucleus',
  'substania_nigra',
  'subthalamic_nucleus',
  'ventral_anterior_nucleus',
  'ventral_lateral_nucleus',
  'ventral_posterior_lateral_nucleus',
  'ventral_posterior_medial_nucleus',
];

async function addBrainparts() {
  console.log(`\n=== ADDING ${labels.length} BRAINPARTS WITH VERSION=2 ===\n`);
  
  let successCount = 0;
  let failureCount = 0;
  const errors = [];

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i].trim();
    
    try {
      const query = `
        INSERT INTO brainparts (title, version, visible)
        VALUES (?, 2, 1)
      `;
      
      await tursoDb.execute({
        sql: query,
        args: [label],
      });
      
      console.log(`✓ [${i + 1}/${labels.length}] Added: "${label}"`);
      successCount++;
    } catch (error) {
      console.error(`✗ [${i + 1}/${labels.length}] Failed to add: "${label}"`);
      console.error(`  Error: ${error.message}`);
      failureCount++;
      errors.push({ label, error: error.message });
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`✓ Successfully added: ${successCount}`);
  console.log(`✗ Failed: ${failureCount}`);
  
  if (errors.length > 0) {
    console.log('\n=== FAILURES ===');
    errors.forEach(({ label, error }) => {
      console.log(`- "${label}": ${error}`);
    });
  }

  if (failureCount === 0) {
    console.log('\n✅ All brainparts added successfully!');
  } else {
    console.log('\n⚠️  Some brainparts failed to add. Check the errors above.');
    process.exit(1);
  }
}

addBrainparts().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
