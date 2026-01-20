// compare_brainparts_svg.js
import Database from 'better-sqlite3';
import fs from 'fs';

// Read SVG IDs from file
function readSvgIds(filename) {
  const content = fs.readFileSync(filename, 'utf-8');
  return content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
}

// Normalize a string: lowercase, replace non-alphanumeric with spaces, collapse double spaces
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function compareBrainpartsToSvg() {
  // Connect to database
  const db = new Database('./data/app.db');
  
  // Get all brainparts from database
  const brainparts = db.prepare('SELECT id, title FROM brainparts ORDER BY id').all();
  console.log(`Found ${brainparts.length} brainparts in database`);
  
  // Read SVG IDs
  const svgIds = readSvgIds('svg_ids.txt');
  console.log(`Found ${svgIds.length} SVG labels`);
  
  // Create normalized set of SVG IDs
  const normalizedSvgIds = new Set(svgIds.map(normalize));
  console.log(`Normalized SVG labels: ${normalizedSvgIds.size} unique`);
  
  // Find brainparts not in SVG
  const missingBrainparts = brainparts.filter(bp => {
    const normalizedTitle = normalize(bp.title);
    return !normalizedSvgIds.has(normalizedTitle);
  });
  
  console.log(`\nBrainparts not found in SVG (${missingBrainparts.length}):\n`);
  missingBrainparts.forEach(bp => {
    console.log(`${bp.id}: ${bp.title} (normalized: "${normalize(bp.title)}")`);
  });
  
  // Write results to file
  const output = missingBrainparts.map(bp => `${bp.id}\t${bp.title}`).join('\n');
  fs.writeFileSync('brainparts_not_in_svg.txt', output);
  console.log(`\nResults written to brainparts_not_in_svg.txt`);
  
  db.close();
}

compareBrainpartsToSvg().catch(console.error);