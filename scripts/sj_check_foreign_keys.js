import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('Checking foreign key constraints...\n');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Check foreign key violations
const violations = db.prepare('PRAGMA foreign_key_check').all();

if (violations.length === 0) {
    console.log('✓ No foreign key violations found!');
} else {
    console.log(`✗ Found ${violations.length} foreign key violation(s):\n`);
    violations.forEach((violation, index) => {
        console.log(`Violation ${index + 1}:`);
        console.log(`  Table: ${violation.table}`);
        console.log(`  Row ID: ${violation.rowid}`);
        console.log(`  Parent Table: ${violation.parent}`);
        console.log(`  Foreign Key Index: ${violation.fkid}`);
        console.log('');
    });
}

// Get list of all tables
const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND name NOT LIKE 'sqlite_%'
    ORDER BY name
`).all();

console.log('\nTables in database:');
tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`  - ${table.name}: ${count.count} rows`);
});

// Check foreign key info for each table
console.log('\nForeign key definitions:');
tables.forEach(table => {
    const fks = db.prepare(`PRAGMA foreign_key_list(${table.name})`).all();
    if (fks.length > 0) {
        console.log(`\n  ${table.name}:`);
        fks.forEach(fk => {
            console.log(`    - Column '${fk.from}' references ${fk.table}(${fk.to}) [id: ${fk.id}, seq: ${fk.seq}]`);
            console.log(`      on_update: ${fk.on_update}, on_delete: ${fk.on_delete}`);
        });
    }
});

db.close();
