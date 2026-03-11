/**
 * Generate 3D meshes for difumo 1024 regions
 * Processes region names, sanitizes names,
 * and calls the Python script to generate meshes
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// difumo 1024 regions list
const difumo64Regions = [
    "Component 202: Subcentral gyrus left",
    "Component 685: Cerebrospinal fluid (between postcentral gyrus and skull)",
    "Component 1021: Cerebellum IX",
];

/**
 * Process region name: sanitize for use as filename
 * @param {string} fullName - Full region name
 * @returns {string} - Sanitized name for file
 */
function sanitizeRegionName(fullName) {
  // Replace non-alphanumeric characters (except spaces) with underscores, then replace spaces with underscores
  const sanitized = fullName
    .replace(/[^\w\s-]/g, '_')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
  return sanitized;
}

/**
 * Get the clean region name (for display and mesh generation)
 * @param {string} fullName - Full region name
 * @returns {string} - Clean name
 */
function getCleanRegionName(fullName) {
  return fullName;
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
 * @param {string} parcellation - Parcellation to use (default: 'difumo 1024')
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
function generateMesh(regionName, parcellation = 'difumo 1024') {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧠 Starting mesh generation for: ${regionName}`);
    if (parcellation !== 'difumo 1024') {
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
  console.log('🔍 Processing difumo 1024 regions...');
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
    
    const success = await generateMesh(cleanName, 'difumo 1024');
    
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
  console.log(`Total difumo 1024 regions: ${difumo64Regions.length}`);
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
