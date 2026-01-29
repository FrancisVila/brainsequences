import Database from 'better-sqlite3';

const db = new Database('data/app.db');

console.log('\n=== SEQUENCES TABLE COLUMNS ===');
const seqInfo = db.prepare('PRAGMA table_info(sequences)').all();
seqInfo.forEach(c => {
  const parts = [c.name, ':', c.type];
  if (c.notnull) parts.push('NOT NULL');
  if (c.dflt_value) parts.push('DEFAULT', c.dflt_value);
  console.log(parts.join(' '));
});

console.log('\n=== STEPS TABLE COLUMNS ===');
const stepInfo = db.prepare('PRAGMA table_info(steps)').all();
stepInfo.forEach(c => {
  const parts = [c.name, ':', c.type];
  if (c.notnull) parts.push('NOT NULL');
  if (c.dflt_value) parts.push('DEFAULT', c.dflt_value);
  console.log(parts.join(' '));
});

console.log('\n=== DATA CHECK ===');
const publishedSeq = db.prepare('SELECT COUNT(*) as count FROM sequences WHERE draft = 0 AND is_published_version = 1').get();
console.log(`Published sequences with is_published_version=1: ${publishedSeq.count}`);

const totalSeq = db.prepare('SELECT COUNT(*) as count FROM sequences').get();
console.log(`Total sequences: ${totalSeq.count}`);

const totalSteps = db.prepare('SELECT COUNT(*) as count FROM steps').get();
console.log(`Total steps: ${totalSteps.count}`);

db.close();
console.log('\n✓ Migration verification complete\n');
