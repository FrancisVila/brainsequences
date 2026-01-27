// sj_find_svg_paths_without_brainparts.js
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Normalize a string: lowercase, replace non-alphanumeric with spaces, collapse double spaces
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function findSvgPathsWithoutBrainparts() {
  // Connect to Turso database
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  
  // Get all brainparts from database
  const result = await db.execute('SELECT id, title FROM brainparts ORDER BY id');
  const brainparts = result.rows;
  console.log(`Found ${brainparts.length} brainparts in database`);
  
  // Create normalized set of brainpart titles
  const normalizedBrainparts = new Set(brainparts.map(bp => normalize(bp.title)));
  
  // Read SVG file
  const svgPath = path.join(__dirname, '..', 'app', 'images', 'tim_taylor.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf-8');
  
  // Extract all path elements with inkscape:label using regex
  // Match <path ... inkscape:label="..." ... >
  const pathRegex = /<path[^>]*inkscape:label="([^"]+)"[^>]*>/g;
  const pathsWithoutBrainparts = [];
  const allLabels = [];
  
  let match;
  while ((match = pathRegex.exec(svgContent)) !== null) {
    const label = match[1];
    allLabels.push(label);
    
    // Skip unwanted labels
    if (label === "Film Grain" || label === "Opacity" || 
        label.startsWith("path") || label.startsWith("rect")) {
      continue;
    }
    
    const normalizedLabel = normalize(label);
    if (!normalizedBrainparts.has(normalizedLabel)) {
      // Try to extract the id attribute
      const idMatch = match[0].match(/\bid="([^"]+)"/);
      const id = idMatch ? idMatch[1] : 'N/A';
      
      pathsWithoutBrainparts.push({
        label: label,
        normalized: normalizedLabel,
        id: id
      });
    }
  }
  
  console.log(`Found ${allLabels.length} total path elements with inkscape:label`);
  console.log(`\nSVG paths without matching brainparts (${pathsWithoutBrainparts.length}):\n`);
  
  pathsWithoutBrainparts.forEach(item => {
    console.log(`ID: ${item.id}\n  Label: ${item.label}\n  Normalized: "${item.normalized}"\n`);
  });
  
  // Write results to file
  const output = pathsWithoutBrainparts.map(item => 
    `${item.id}\t${item.label}\t${item.normalized}`
  ).join('\n');
  fs.writeFileSync(path.join(__dirname, 'svg_paths_without_brainparts.txt'), output);
  console.log(`\nResults written to svg_paths_without_brainparts.txt`);
}

findSvgPathsWithoutBrainparts().catch(console.error);