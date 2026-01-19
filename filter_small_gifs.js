import fs from 'fs';

// Read the current wikimedia.tsx file
const content = fs.readFileSync('app/routes/wikimedia.tsx', 'utf-8');

// Extract all lines that contain image entries
const lines = content.split('\n');
const entries = [];
let inDiv = false;

for (const line of lines) {
  if (line.includes('<div>')) {
    inDiv = true;
    continue;
  }
  if (line.includes('</div>')) {
    break;
  }
  if (inDiv && line.trim().startsWith('<p>')) {
    entries.push(line);
  }
}

console.log(`Found ${entries.length} total entries`);

// Parse entries to extract filenames
const parsedEntries = entries.map(line => {
  // Extract filename from the line
  const match = line.match(/File:([^"\n]+)/);
  if (match) {
    const fullName = match[1].trim();
    // Get just the base filename (without path)
    const fileName = fullName.split('/').pop();
    return {
      line,
      fileName,
      fullName
    };
  }
  return null;
}).filter(Boolean);

console.log(`Parsed ${parsedEntries.length} entries with filenames`);

// Build a map of base names (without _small) to entries
const baseNameMap = new Map();
const entriesToRemove = new Set();

parsedEntries.forEach((entry, index) => {
  const fileName = entry.fileName;
  
  // Check if this is a _small version
  if (fileName.includes('_small.gif') || fileName.includes('_small2.gif')) {
    // Get the base name by removing _small or _small2
    const baseName = fileName.replace('_small2.gif', '.gif').replace('_small.gif', '.gif');
    
    // Check if we have a non-small version
    const hasNonSmall = parsedEntries.some(e => 
      e.fileName === baseName && e.line !== entry.line
    );
    
    if (hasNonSmall) {
      console.log(`Will remove: ${fileName} (base ${baseName} exists)`);
      entriesToRemove.add(entry.line);
    }
  }
});

console.log(`\nRemoving ${entriesToRemove.size} duplicate _small entries`);

// Filter out the entries to remove
const filteredEntries = entries.filter(line => !entriesToRemove.has(line));

console.log(`Remaining entries: ${filteredEntries.length}`);

// Regenerate the file
const jsxContent = filteredEntries.join('\n');

const newContent = `export default function Wikimedia() {
  return (
    <div style={{padding: '20px'}}>
      <h1>Wikimedia Brain Images</h1>
      <div>
${jsxContent}
      </div>
    </div>
  );
}
`;

// Write the updated file
fs.writeFileSync('app/routes/wikimedia.tsx', newContent);

console.log('\nFile updated successfully!');
console.log(`Original: ${entries.length} entries`);
console.log(`Removed: ${entriesToRemove.size} entries`);
console.log(`Final: ${filteredEntries.length} entries`);
