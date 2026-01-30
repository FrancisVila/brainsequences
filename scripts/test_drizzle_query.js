import { db } from './app/server/drizzle.js';
import { sequences } from './drizzle/schema.js';
import { eq, and } from 'drizzle-orm';

// Simple test to verify Drizzle queries work
async function testDrizzleQuery() {
  console.log('Testing Drizzle ORM query...\n');
  
  try {
    console.log('1. Testing getPublishedSequences query...');
    const result = await db.select().from(sequences).where(
      and(
        eq(sequences.draft, 0),
        eq(sequences.isPublishedVersion, 1)
      )
    ).orderBy(sequences.id);
    
    console.log(`✅ Success! Found ${result.length} published sequences`);
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDrizzleQuery().catch(console.error);
