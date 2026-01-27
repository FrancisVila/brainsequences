import Database from 'better-sqlite3';

const db = new Database('./data/app.db');

// Check if steps table has description column
console.log('Steps table schema:');
const schema = db.prepare("PRAGMA table_info('steps')").all();
console.log(schema);

// Get all steps with their descriptions
console.log('\nSteps with descriptions:');
const steps = db.prepare('SELECT id, sequence_id, title, description FROM steps LIMIT 10').all();
console.log(steps);

db.close();
