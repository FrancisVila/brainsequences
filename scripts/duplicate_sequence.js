/**
 * Duplicate a sequence and all its related data (steps, brainparts, arrows, links, citations)
 * The duplicate will be marked as a draft
 * 
 * Usage: node scripts/duplicate_sequence.js <sequence_id> [new_title]
 * Example: node scripts/duplicate_sequence.js 25 "Copy of Original Sequence"
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

async function duplicateSequence(sourceSequenceId, newTitle = null) {
  console.log(`\n=== Duplicating sequence ${sourceSequenceId} ===\n`);
  
  try {
    // 1. Get the original sequence
    const sourceSeqResult = await tursoDb.execute({
      sql: 'SELECT * FROM sequences WHERE id = ?',
      args: [sourceSequenceId]
    });
    
    if (sourceSeqResult.rows.length === 0) {
      console.error(`❌ Sequence ${sourceSequenceId} not found`);
      process.exit(1);
    }
    
    const sourceSeq = sourceSeqResult.rows[0];
    console.log(`📋 Source sequence: ${sourceSeq.title}`);
    
    // 2. Create duplicate sequence (as draft)
    const duplicateTitle = newTitle || `${sourceSeq.title} (Copy)`;
    const newSeqResult = await tursoDb.execute({
      sql: `
        INSERT INTO sequences (
          title, description, atlas_svg_file, user_id, 
          draft, published_version_id, is_published_version
        ) VALUES (?, ?, ?, ?, 1, NULL, 0)
        RETURNING id
      `,
      args: [
        duplicateTitle,
        sourceSeq.description,
        sourceSeq.atlas_svg_file,
        sourceSeq.user_id
      ]
    });
    
    const newSequenceId = newSeqResult.rows[0].id;
    console.log(`✅ Created new sequence ID ${newSequenceId}: ${duplicateTitle}`);
    
    // 3. Get all steps from source sequence
    const stepsResult = await tursoDb.execute({
      sql: 'SELECT * FROM steps WHERE sequence_id = ? ORDER BY id',
      args: [sourceSequenceId]
    });
    
    console.log(`\n📝 Duplicating ${stepsResult.rows.length} steps...`);
    
    // Map old step IDs to new step IDs
    const stepIdMap = new Map();
    
    // 4. Duplicate each step
    for (const sourceStep of stepsResult.rows) {
      // Create new step
      const newStepResult = await tursoDb.execute({
        sql: `
          INSERT INTO steps (
            sequence_id, title, description, atlas_svg_file, draft
          ) VALUES (?, ?, ?, ?, 1)
          RETURNING id
        `,
        args: [
          newSequenceId,
          sourceStep.title,
          sourceStep.description,
          sourceStep.atlas_svg_file
        ]
      });
      
      const newStepId = newStepResult.rows[0].id;
      stepIdMap.set(sourceStep.id, newStepId);
      console.log(`  Step ${sourceStep.id} → ${newStepId}: ${sourceStep.title}`);
      
      // 5. Duplicate step_brainparts relationships
      const stepBrainpartsResult = await tursoDb.execute({
        sql: 'SELECT * FROM step_brainparts WHERE step_id = ?',
        args: [sourceStep.id]
      });
      
      for (const sbp of stepBrainpartsResult.rows) {
        await tursoDb.execute({
          sql: 'INSERT INTO step_brainparts (step_id, brainpart_id) VALUES (?, ?)',
          args: [newStepId, sbp.brainpart_id]
        });
      }
      
      if (stepBrainpartsResult.rows.length > 0) {
        console.log(`    ├─ ${stepBrainpartsResult.rows.length} brainparts linked`);
      }
      
      // 6. Duplicate arrows
      const arrowsResult = await tursoDb.execute({
        sql: 'SELECT * FROM arrows WHERE step_id = ?',
        args: [sourceStep.id]
      });
      
      for (const arrow of arrowsResult.rows) {
        await tursoDb.execute({
          sql: `
            INSERT INTO arrows (
              description, from_brainpart_id, to_brainpart_id, step_id
            ) VALUES (?, ?, ?, ?)
          `,
          args: [
            arrow.description,
            arrow.from_brainpart_id,
            arrow.to_brainpart_id,
            newStepId
          ]
        });
      }
      
      if (arrowsResult.rows.length > 0) {
        console.log(`    ├─ ${arrowsResult.rows.length} arrows copied`);
      }
      
      // 7. Duplicate step_links
      const stepLinksResult = await tursoDb.execute({
        sql: 'SELECT * FROM step_link WHERE step_id = ?',
        args: [sourceStep.id]
      });
      
      for (const link of stepLinksResult.rows) {
        await tursoDb.execute({
          sql: `
            INSERT INTO step_link (
              step_id, x1, y1, x2, y2, curvature, strokeWidth
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            newStepId,
            link.x1,
            link.y1,
            link.x2,
            link.y2,
            link.curvature,
            link.strokeWidth
          ]
        });
      }
      
      if (stepLinksResult.rows.length > 0) {
        console.log(`    ├─ ${stepLinksResult.rows.length} step links copied`);
      }
      
      // 8. Duplicate citations
      const citationsResult = await tursoDb.execute({
        sql: 'SELECT * FROM citations WHERE step_id = ? ORDER BY order_index',
        args: [sourceStep.id]
      });
      
      for (const citation of citationsResult.rows) {
        await tursoDb.execute({
          sql: `
            INSERT INTO citations (
              step_id, title, url, order_index, hover
            ) VALUES (?, ?, ?, ?, ?)
          `,
          args: [
            newStepId,
            citation.title,
            citation.url,
            citation.order_index,
            citation.hover
          ]
        });
      }
      
      if (citationsResult.rows.length > 0) {
        console.log(`    └─ ${citationsResult.rows.length} citations copied`);
      }
    }
    
    console.log(`\n✅ Successfully duplicated sequence!`);
    console.log(`   Original: ${sourceSequenceId} - ${sourceSeq.title}`);
    console.log(`   Duplicate: ${newSequenceId} - ${duplicateTitle} (DRAFT)`);
    
    return newSequenceId;
    
  } catch (error) {
    console.error('❌ Error duplicating sequence:', error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/duplicate_sequence.js <sequence_id> [new_title]');
  console.error('Example: node scripts/duplicate_sequence.js 25 "Copy of My Sequence"');
  process.exit(1);
}

const sourceSequenceId = parseInt(args[0], 10);
const newTitle = args[1] || null;

if (isNaN(sourceSequenceId)) {
  console.error('❌ Invalid sequence ID');
  process.exit(1);
}

// Run the duplication
duplicateSequence(sourceSequenceId, newTitle)
  .then((newId) => {
    console.log(`\n🎉 Done! New sequence ID: ${newId}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });