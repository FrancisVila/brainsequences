import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const tursoDb = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

console.log('Checking Turso brainparts table schema...\n');

try {
  // Get table info for brainparts
  const result = await tursoDb.execute('PRAGMA table_info(brainparts)');
  console.log('Brainparts table columns:');
  console.log(JSON.stringify(result.rows, null, 2));
  
  // Also check for indexes or foreign keys
  console.log('\n\nForeign keys:');
  const fkResult = await tursoDb.execute('PRAGMA foreign_key_list(brainparts)');
  console.log(JSON.stringify(fkResult.rows, null, 2));
  
  console.log('\n\nIndexes:');
  const indexResult = await tursoDb.execute('PRAGMA index_list(brainparts)');
  console.log(JSON.stringify(indexResult.rows, null, 2));
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
