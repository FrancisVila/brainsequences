/**
 * Generate 3D meshes for all visible brainparts in the database
 * Queries the database for brainparts with visible=1 and calls the Python script for each
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const tursoDb = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

/**
 * Execute Python script to generate mesh for a specific brain region
 * @param {string} regionName - Name of the brain region
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
        const safeFilename = regionName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[-\s]+/g, '_');
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
  console.log('🔍 Querying database for visible brainparts...');
  console.log('Database URL:', process.env.DATABASE_URL);

  try {
    // Query for all brainparts with visible=1
    const result = await tursoDb.execute(`
      SELECT id, title, description
      FROM brainparts
      WHERE visible = 1
      ORDER BY title
    `);

    const visibleBrainparts = result.rows;
    
    console.log(`\n✅ Found ${visibleBrainparts.length} visible brainparts:\n`);
    visibleBrainparts.forEach((bp, index) => {
      console.log(`${index + 1}. ${bp.title} (ID: ${bp.id})`);
    });

    if (visibleBrainparts.length === 0) {
      console.log('\n⚠️  No visible brainparts found. Exiting.');
      return;
    }

    console.log('\n' + '='.repeat(60));
    console.log('🚀 Starting mesh generation process...');
    console.log('='.repeat(60));

    // Track success/failure
    const results = {
      total: visibleBrainparts.length,
      successful: 0,
      failed: 0,
      failedRegions: []
    };

    // Generate mesh for each visible brainpart
    for (let i = 0; i < visibleBrainparts.length; i++) {
      const brainpart = visibleBrainparts[i];
      console.log(`\n[${i + 1}/${visibleBrainparts.length}] Processing: ${brainpart.title}`);
      
      const success = await generateMesh(brainpart.title, 'difumo 64');
      
      if (success) {
        results.successful++;
      } else {
        results.failed++;
        results.failedRegions.push(brainpart.title);
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

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total brainparts processed: ${results.total}`);
    console.log(`✅ Successful: ${results.successful}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.failedRegions.length > 0) {
      console.log('\n⚠️  Regions that failed with both parcellations:');
      results.failedRegions.forEach(region => {
        console.log(`  - ${region}`);
      });
    }
    
    console.log('\n🎉 Mesh generation process complete!');

  } catch (error) {
    console.error('❌ Error querying database:', error);
    throw error;
  }
}

// Run the script
main().catch(console.error);
