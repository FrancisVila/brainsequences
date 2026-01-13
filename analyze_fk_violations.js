import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('Analyzing step_brainparts foreign key violations...\n');

// Get all step_brainparts with their step_ids
const stepBrainparts = db.prepare('SELECT rowid, step_id, brainpart_id FROM step_brainparts ORDER BY rowid').all();
console.log(`Total step_brainparts rows: ${stepBrainparts.length}\n`);

// Get all valid step IDs
const validSteps = db.prepare('SELECT id FROM steps ORDER BY id').all();
const validStepIds = new Set(validSteps.map(s => s.id));
console.log(`Valid step IDs: ${Array.from(validStepIds).join(', ')}\n`);

// Find invalid step_ids
const invalidRows = stepBrainparts.filter(row => !validStepIds.has(row.step_id));
console.log(`Invalid step_brainparts rows: ${invalidRows.length}\n`);

// Group by step_id to see which invalid IDs are referenced
const invalidByStepId = {};
invalidRows.forEach(row => {
    if (!invalidByStepId[row.step_id]) {
        invalidByStepId[row.step_id] = [];
    }
    invalidByStepId[row.step_id].push(row.rowid);
});

console.log('Invalid step_ids referenced:');
Object.keys(invalidByStepId).sort((a, b) => Number(a) - Number(b)).forEach(stepId => {
    console.log(`  step_id ${stepId}: ${invalidByStepId[stepId].length} rows (rowids: ${invalidByStepId[stepId].join(', ')})`);
});

console.log('\n--- Fix Options ---');
console.log('Option 1: Delete all invalid step_brainparts rows');
console.log('Option 2: Update invalid step_ids to valid values (if you know the correct mapping)');
console.log('Option 3: Create the missing steps');

db.close();
