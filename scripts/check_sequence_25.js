/**
 * Check sequence 25 details
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const tursoUrl = process.env.DATABASE_URL;
const tursoAuthToken = process.env.DATABASE_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
  console.error('❌ Missing Turso credentials');
  process.exit(1);
}

const tursoDb = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

async function checkSequence() {
  console.log('=== Checking sequence 25 ===\n');
  
  // Get sequence 25
  const seq = await tursoDb.execute('SELECT * FROM sequences WHERE id = 25');
  
  if (seq.rows.length === 0) {
    console.log('❌ Sequence 25 does not exist');
    return;
  }
  
  console.log('Sequence 25:', seq.rows[0]);
  
  // Check if user exists
  if (seq.rows[0].user_id) {
    const user = await tursoDb.execute(`SELECT id, email FROM users WHERE id = ${seq.rows[0].user_id}`);
    console.log('\nOwner:', user.rows[0]);
  } else {
    console.log('\n❌ No user_id set!');
  }
  
  // Check other sequences for this user
  if (seq.rows[0].user_id) {
    const userSeqs = await tursoDb.execute(`SELECT id, title, draft, published_version_id, is_published_version FROM sequences WHERE user_id = ${seq.rows[0].user_id} ORDER BY id`);
    console.log('\nAll sequences for this user:');
    userSeqs.rows.forEach(s => {
      console.log(`  - ID ${s.id}: ${s.title} (draft=${s.draft}, published_version_id=${s.published_version_id}, is_published_version=${s.is_published_version})`);
    });
  }
}

checkSequence()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
