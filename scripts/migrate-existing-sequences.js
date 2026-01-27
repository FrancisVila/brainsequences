/**
 * Migration script to assign all existing sequences to the first admin user
 * 
 * Run this script once after deploying the authentication system to assign
 * ownership of all existing sequences (where user_id is NULL) to the first
 * admin user.
 * 
 * Usage:
 *   node scripts/migrate-existing-sequences.js
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

try {
  console.log('Starting migration of existing sequences...\n');

  // Find the first admin user
  const adminUser = db.prepare(`
    SELECT id, email FROM users 
    WHERE role = 'admin' 
    ORDER BY created_at ASC 
    LIMIT 1
  `).get();

  if (!adminUser) {
    console.error('❌ No admin user found!');
    console.log('Please create an admin user first by signing up at /signup');
    console.log('The first user to sign up will automatically be assigned admin role.');
    process.exit(1);
  }

  console.log(`✅ Found admin user: ${adminUser.email} (ID: ${adminUser.id})\n`);

  // Find all sequences without an owner
  const orphanedSequences = db.prepare(`
    SELECT id, title FROM sequences 
    WHERE user_id IS NULL
  `).all();

  if (orphanedSequences.length === 0) {
    console.log('✅ No orphaned sequences found. All sequences already have owners.');
    process.exit(0);
  }

  console.log(`Found ${orphanedSequences.length} sequence(s) without owners:\n`);
  orphanedSequences.forEach(seq => {
    console.log(`  - Sequence ${seq.id}: "${seq.title}"`);
  });

  console.log('\nAssigning ownership to admin user...\n');

  // Update all sequences without an owner
  const updateStmt = db.prepare(`
    UPDATE sequences 
    SET user_id = ?, is_published = 1
    WHERE user_id IS NULL
  `);

  const result = updateStmt.run(adminUser.id);

  console.log(`✅ Successfully assigned ${result.changes} sequence(s) to ${adminUser.email}`);
  console.log('✅ All sequences have been marked as published (is_published = 1)');
  console.log('\nMigration complete! 🎉');

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
