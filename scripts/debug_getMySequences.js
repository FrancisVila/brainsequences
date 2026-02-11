/**
 * Debug getMySequences for user 9 (francis)
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

async function debugGetMySequences(userId) {
  console.log(`=== Debugging getMySequences for user ${userId} ===\n`);
  
  // Get sequences where user is owner
  const ownedSequencesResult = await tursoDb.execute(`SELECT * FROM sequences WHERE user_id = ${userId} ORDER BY id`);
  const ownedSequences = ownedSequencesResult.rows;
  console.log('Owned sequences:', ownedSequences.length);
  ownedSequences.forEach(s => {
    console.log(`  - ID ${s.id}: ${s.title} (draft=${s.draft}, published_version_id=${s.published_version_id})`);
  });
  
  // Get sequences where user is collaborator
  const collaboratorSequencesResult = await tursoDb.execute(`
    SELECT s.* 
    FROM sequence_collaborators sc
    INNER JOIN sequences s ON sc.sequence_id = s.id
    WHERE sc.user_id = ${userId}
    ORDER BY s.id
  `);
  const collaboratorSequences = collaboratorSequencesResult.rows;
  
  console.log('\nCollaborator sequences:', collaboratorSequences.length);
  
  // Combine and deduplicate by id
  const allSequences = [...ownedSequences];
  const ownedIds = new Set(ownedSequences.map(s => s.id));
  
  for (const seq of collaboratorSequences) {
    if (!ownedIds.has(seq.id)) {
      allSequences.push(seq);
    }
  }
  
  console.log('\nCombined sequences:', allSequences.length);
  
  // Filter out published versions when a draft exists
  const draftPublishedIds = new Set(
    allSequences
      .filter(s => s.draft === 1 && s.published_version_id !== null)
      .map(s => s.published_version_id)
  );
  
  console.log('\nPublished IDs with drafts:', Array.from(draftPublishedIds));
  
  const filteredSequences = allSequences.filter(s => {
    const keep = !draftPublishedIds.has(s.id);
    console.log(`  - ID ${s.id}: ${s.title} - keep=${keep}`);
    return keep;
  });
  
  console.log('\nFinal filtered sequences:', filteredSequences.length);
  filteredSequences.forEach(s => {
    console.log(`  - ID ${s.id}: ${s.title} (draft=${s.draft})`);
  });
  
  return filteredSequences;
}

debugGetMySequences(9)
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
