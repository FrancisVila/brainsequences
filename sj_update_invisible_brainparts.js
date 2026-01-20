import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./data/app.db');

// Read brainparts from file (format: "id\ttitle")
const content = fs.readFileSync('brainparts_not_in_svg.txt', 'utf-8');
const lines = content.split('\n').filter(line => line.trim().length > 0);

// Extract titles from each line (format: "2: Sensory_Cortex (normalized: ...)")
const titles = lines.map(line => {
  // Parse "id: title (normalized: ...)" format
  const match = line.match(/^\d+:\s+(.+?)\s+\(normalized:/);
  if (match) {
    return match[1];
  }
  // Fallback: try "id\ttitle" format
  const parts = line.split('\t');
  return parts.length > 1 ? parts[1] : parts[0];
});

console.log(`Found ${titles.length} brainparts to mark as invisible`);

// Update visible to 0 (false) for each brainpart
const updateStmt = db.prepare('UPDATE brainparts SET visible = 0 WHERE title = ?');

let updated = 0;
for (const title of titles) {
  const result = updateStmt.run(title);
  if (result.changes > 0) {
    updated++;
    console.log(`Updated: ${title}`);
  }
}

console.log(`\nUpdated ${updated} brainparts to visible=false`);
db.close();
