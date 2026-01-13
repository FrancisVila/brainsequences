import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('Foreign Key Violations Fix Script\n');
console.log('This will delete all step_brainparts rows that reference non-existent steps.\n');

// Show what will be deleted
const violations = db.prepare('PRAGMA foreign_key_check(step_brainparts)').all();
console.log(`Found ${violations.length} violating rows that will be deleted.\n`);

// Get the invalid rows with details
const invalidRows = db.prepare(`
    SELECT sb.rowid, sb.step_id, sb.brainpart_id, b.title as brainpart_title
    FROM step_brainparts sb
    LEFT JOIN brainparts b ON sb.brainpart_id = b.id
    WHERE sb.step_id NOT IN (SELECT id FROM steps)
    ORDER BY sb.step_id, sb.rowid
`).all();

console.log('Details of rows to be deleted:');
invalidRows.forEach((row, i) => {
    if (i < 10 || i >= invalidRows.length - 5) {
        console.log(`  rowid ${row.rowid}: step_id=${row.step_id}, brainpart="${row.brainpart_title}"`);
    } else if (i === 10) {
        console.log(`  ... (${invalidRows.length - 15} more rows) ...`);
    }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\nDo you want to proceed with deletion? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        try {
            db.prepare('PRAGMA foreign_keys = OFF').run();
            
            const result = db.prepare(`
                DELETE FROM step_brainparts 
                WHERE step_id NOT IN (SELECT id FROM steps)
            `).run();
            
            db.prepare('PRAGMA foreign_keys = ON').run();
            
            console.log(`\n✓ Deleted ${result.changes} rows from step_brainparts`);
            
            // Verify no more violations
            const remaining = db.prepare('PRAGMA foreign_key_check').all();
            if (remaining.length === 0) {
                console.log('✓ No foreign key violations remaining!');
            } else {
                console.log(`⚠ Warning: ${remaining.length} violations still exist`);
            }
        } catch (error) {
            console.error('✗ Error:', error.message);
        }
    } else {
        console.log('Operation cancelled.');
    }
    
    db.close();
    rl.close();
});
