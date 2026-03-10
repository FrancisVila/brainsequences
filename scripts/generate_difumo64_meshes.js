/**
 * Generate 3D meshes for DiFuMo 64 regions
 * Processes region names, removes "Component X: " prefix, sanitizes names,
 * and calls the Python script to generate meshes
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// DiFuMo 64 regions list
const difumo64Regions = [
  "Component 10: Superior parts of Postcentral and Precentral gyri",
  "Component 11: Transverse sinus",
  "Component 12: Paracentral gyrus right",
  "Component 13: Superior occipital gyrus",
  "Component 14: Cingulate gyrus mid-posterior",
  "Component 15: ventricles",
  "Component 16: Fusiform gyrus posterior",
  "Component 17: Superior frontal gyrus medial",
  "Component 18: Precuneus superior",
  "Component 19: Planum polare",
  "Component 1: Superior frontal sulcus",
  "Component 20: Parieto-occipital sulcus middle",
  "Component 21: Cerebellum I-V",
  "Component 22: Superior fornix and isthmus",
  "Component 23: Anterior Cingulate Cortex",
  "Component 24: Descending occipital gyrus",
  "Component 25: Putamen",
  "Component 26: Cingulate gyrus mid-anterior",
  "Component 27: Superior parietal lobule posterior",
  "Component 28: Paracentral lobule",
  "Component 29: Inferior occipital gyrus",
  "Component 2: Fusiform gyrus",
  "Component 30: Superior rostral gyrus",
  "Component 31: Calcarine sulcus anterior",
  "Component 32: Intraparietal sulcus",
  "Component 33: Superior parietal lobule anterior",
  "Component 34: Precentral gyrus medial",
  "Component 35: Lingual gyrus anterior",
  "Component 36: Angular gyrus superior",
  "Component 37: Supramarginal gyrus",
  "Component 38: Intraparietal sulcus left",
  "Component 39: Dorsomedial prefrontal cortex antero-superior",
  "Component 3: Calcarine cortex posterior",
  "Component 40: Precentral gyrus superior",
  "Component 41: Postcentral gyrus inferior",
  "Component 42: Lateral occipital cortex",
  "Component 43: Callosomarginal sulcus",
  "Component 44: Paracentral lobule superior",
  "Component 45: Heschl's gyrus",
  "Component 46: Occipital pole",
  "Component 47: Thalamus",
  "Component 48: Intraparietal sulcus right",
  "Component 49: Inferior frontal sulcus",
  "Component 4: Cingulate cortex posterior",
  "Component 50: Postcentral gyrus left",
  "Component 51: Middle frontal gyrus",
  "Component 52: Inferior frontal gyrus",
  "Component 53: Parieto-occipital sulcus anterior",
  "Component 54: Precuneus anterior",
  "Component 55: Lingual gyrus",
  "Component 56: Superior occipital sulcus",
  "Component 57: Superior parietal lobule",
  "Component 58: Middle frontal gyrus anterior",
  "Component 59: Angular gyrus inferior",
  "Component 5: Parieto-occipital sulcus superior",
  "Component 60: Cuneus",
  "Component 61: Middle temporal gyrus",
  "Component 62: Superior frontal gyrus",
  "Component 63: Central sulcus",
  "Component 64: Caudate",
  "Component 6: Insula antero-superior",
  "Component 7: Superior temporal sulcus with angular gyrus",
  "Component 8: Planum temporale",
  "Component 9: Cerebellum Crus II"
];

/**
 * Process region name: remove "Component X: " prefix and sanitize
 * @param {string} fullName - Full region name with component prefix
 * @returns {string} - Sanitized name for file
 */
function sanitizeRegionName(fullName) {
  // Remove "Component \d+: " prefix
  const nameWithoutPrefix = fullName.replace(/^Component\s+\d+:\s+/, '');
  // Replace non-alphanumeric characters (except spaces) with underscores, then replace spaces with underscores
  const sanitized = nameWithoutPrefix
    .replace(/[^\w\s-]/g, '_')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
  return sanitized;
}

/**
 * Get the clean region name without prefix (for display and mesh generation)
 * @param {string} fullName - Full region name with component prefix
 * @returns {string} - Clean name without prefix
 */
function getCleanRegionName(fullName) {
  return fullName.replace(/^Component\s+\d+:\s+/, '');
}

/**
 * Check if mesh file already exists
 * @param {string} sanitizedName - Sanitized filename
 * @returns {boolean} - True if mesh exists
 */
function meshExists(sanitizedName) {
  const meshPath = join(__dirname, '..', 'public', 'meshes', `${sanitizedName}.glb`);
  return existsSync(meshPath);
}

/**
 * Execute Python script to generate mesh for a specific brain region
 * @param {string} regionName - Name of the brain region (without Component prefix)
 * @param {string} parcellation - Parcellation to use (default: 'difumo 64')
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
function generateMesh(regionName, parcellation = 'difumo 64') {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧠 Starting mesh generation for: ${regionName}`);
    if (parcellation !== 'difumo 64') {
      console.log(`   🔄 Retry with parcellation: ${parcellation}`);
    }
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
        const safeFilename = sanitizeRegionName(`Component: ${regionName}`);
        const meshPath = join(__dirname, '..', 'public', 'meshes', `${safeFilename}.glb`);
        
        if (existsSync(meshPath)) {
          console.log(`✅ Successfully generated mesh for ${regionName}`);
          resolve(true);
        } else {
          console.error(`❌ Process completed but no .glb file found for ${regionName}`);
          resolve(false);
        }
      } else {
        console.error(`❌ Failed to generate mesh for ${regionName} (exit code: ${code})`);
        resolve(false); // Resolve with false instead of rejecting to continue with other regions
      }
    });

    pythonProcess.on('error', (err) => {
      console.error(`❌ Error spawning Python process for ${regionName}:`, err);
      resolve(false);
    });
  });
}

async function main() {
  console.log('🔍 Processing DiFuMo 64 regions...');
  console.log(`Total regions: ${difumo64Regions.length}\n`);

  // Process regions and check which ones already have meshes
  const regionsToProcess = [];
  const alreadyExist = [];

  for (const fullName of difumo64Regions) {
    const cleanName = getCleanRegionName(fullName);
    const sanitizedName = sanitizeRegionName(fullName);
    
    if (meshExists(sanitizedName)) {
      alreadyExist.push({ fullName, cleanName, sanitizedName });
      console.log(`⏭️  Skipping "${cleanName}" (mesh already exists: ${sanitizedName}.glb)`);
    } else {
      regionsToProcess.push({ fullName, cleanName, sanitizedName });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 PRE-GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total regions: ${difumo64Regions.length}`);
  console.log(`✅ Already exist: ${alreadyExist.length}`);
  console.log(`🔨 To generate: ${regionsToProcess.length}`);

  if (regionsToProcess.length === 0) {
    console.log('\n🎉 All meshes already exist! Nothing to generate.');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('🚀 Starting mesh generation process...');
  console.log('='.repeat(60));

  // Track success/failure
  const results = {
    total: regionsToProcess.length,
    successful: 0,
    failed: 0,
    failedRegions: []
  };

  // Generate mesh for each region that doesn't exist
  for (let i = 0; i < regionsToProcess.length; i++) {
    const { cleanName, sanitizedName } = regionsToProcess[i];
    console.log(`\n[${i + 1}/${regionsToProcess.length}] Processing: ${cleanName}`);
    console.log(`   📝 Filename will be: ${sanitizedName}.glb`);
    
    const success = await generateMesh(cleanName, 'difumo 64');
    
    if (success) {
      results.successful++;
    } else {
      results.failed++;
      results.failedRegions.push(cleanName);
    }
  }

  // Retry failed regions with difumo 128
  if (results.failedRegions.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log(`🔄 RETRYING ${results.failedRegions.length} FAILED REGIONS WITH 'difumo 128'`);
    console.log('='.repeat(60));

    const retryResults = {
      successful: 0,
      failed: 0,
      stillFailedRegions: []
    };

    for (let i = 0; i < results.failedRegions.length; i++) {
      const regionName = results.failedRegions[i];
      console.log(`\n[Retry ${i + 1}/${results.failedRegions.length}] Processing: ${regionName}`);
      
      const success = await generateMesh(regionName, 'difumo 128');
      
      if (success) {
        retryResults.successful++;
        results.successful++; // Update overall count
        results.failed--; // Decrease failed count
      } else {
        retryResults.failed++;
        retryResults.stillFailedRegions.push(regionName);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔄 RETRY SUMMARY');
    console.log('='.repeat(60));
    console.log(`Regions retried: ${results.failedRegions.length}`);
    console.log(`✅ Now successful: ${retryResults.successful}`);
    console.log(`❌ Still failed: ${retryResults.failed}`);
    
    // Update failed regions list to only include those still failed
    results.failedRegions = retryResults.stillFailedRegions;
  }

  // Print final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total DiFuMo 64 regions: ${difumo64Regions.length}`);
  console.log(`⏭️  Already existed: ${alreadyExist.length}`);
  console.log(`🔨 Attempted to generate: ${results.total}`);
  console.log(`✅ Successfully generated: ${results.successful}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.failedRegions.length > 0) {
    console.log('\n⚠️  Regions that failed with both parcellations:');
    results.failedRegions.forEach(region => {
      console.log(`  - ${region}`);
    });
  }
  
  console.log('\n🎉 Mesh generation process complete!');
}

// Run the script
main().catch(console.error);
