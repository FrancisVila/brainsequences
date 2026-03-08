/**
 * Regenerate specific brain regions with difumo 64 parcellation
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// List of regions to regenerate
const regionsToRegenerate = [
  '4th_ventricle',
  'Angular_gyrus',
  'Brain stem',
  'Cerebellum',
  'Cerebral_aqueduct',
  'Cerebrum',
  'Choroid_plexus',
  'Cingulate_gyrus',
  'Corpus_callosum',
  'Frontal_pole',
  'Hippocampus',
  'Hypothalamic_sulcus',
  'Hypothalamus',
  'Inferior_Colliculus',
  'Inferior_parietal_lobule',
  'Interthalamic_adhesion',
  'Lamina_terminalis',
  'Medulla_Oblongata',
  'Middle_frontal_gyrus',
  'Optic_chiasm',
  'Optic_recess',
  'Paraterminal_gyrus',
  'Pineal_gland',
  'Pituitary_gland',
  'Pons',
  'Precentral_gyrus',
  'Precentral_sulcus',
  'Precuneus',
  'Septum_pellucidum',
  'Stem',
  'Sulcus_of_corpus_callosum',
  'Superior_Colliculus',
  'Superior_parietal_lobule',
  'Ventral_tegmental_area'
];

/**
 * Execute Python script to generate mesh for a specific brain region
 * @param {string} regionName - Name of the brain region
 * @param {string} parcellation - Parcellation to use
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
function generateMesh(regionName, parcellation = 'difumo 64') {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧠 Regenerating mesh for: ${regionName}`);
    console.log(`   Using parcellation: ${parcellation}`);
    console.log('='.repeat(60));

    // Path to the Python CLI wrapper script
    const scriptPath = join(__dirname, 'generate_mesh_cli.py');
    
    // Using python from virtual environment
    const pythonPath = join(__dirname, '..', '.venv', 'Scripts', 'python.exe');
    
    const pythonProcess = spawn(pythonPath, [scriptPath, regionName, parcellation], {
      cwd: __dirname,
      stdio: 'inherit' // Show Python output in real-time
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        // Double-check that the .glb file was actually created
        const safeFilename = regionName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[-\s]+/g, '_');
        const meshPath = join(__dirname, '..', 'public', 'meshes', `${safeFilename}.glb`);
        
        if (existsSync(meshPath)) {
          console.log(`✅ Successfully regenerated mesh for ${regionName}`);
          resolve(true);
        } else {
          console.error(`❌ Process completed but no .glb file found for ${regionName}`);
          resolve(false);
        }
      } else {
        console.error(`❌ Failed to regenerate mesh for ${regionName} (exit code: ${code})`);
        resolve(false);
      }
    });

    pythonProcess.on('error', (err) => {
      console.error(`❌ Error spawning Python process for ${regionName}:`, err);
      resolve(false);
    });
  });
}

async function main() {
  console.log('🔄 Regenerating specific brain regions with difumo 1024...');
  console.log(`Total regions to regenerate: ${regionsToRegenerate.length}\n`);
  
  regionsToRegenerate.forEach((region, index) => {
    console.log(`${index + 1}. ${region}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('🚀 Starting regeneration process...');
  console.log('='.repeat(60));

  // Track success/failure
  const results = {
    total: regionsToRegenerate.length,
    successful: 0,
    failed: 0,
    failedRegions: []
  };

  // Generate mesh for each region
  for (let i = 0; i < regionsToRegenerate.length; i++) {
    const regionName = regionsToRegenerate[i];
    console.log(`\n[${i + 1}/${regionsToRegenerate.length}] Processing: ${regionName}`);
    
    const success = await generateMesh(regionName, 'difumo 1024');
    
    if (success) {
      results.successful++;
    } else {
      results.failed++;
      results.failedRegions.push(regionName);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 REGENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total regions processed: ${results.total}`);
  console.log(`✅ Successful: ${results.successful}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.failedRegions.length > 0) {
    console.log('\n⚠️  Failed regions:');
    results.failedRegions.forEach(region => {
      console.log(`  - ${region}`);
    });
  }
  
  console.log('\n🎉 Regeneration process complete!');
}

// Run the script
main().catch(console.error);
