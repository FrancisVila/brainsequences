import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const tursoDb = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

console.log('Testing Turso connection...');
console.log('URL:', process.env.DATABASE_URL);

try {
  const result = await tursoDb.execute('SELECT 1 as test');
  console.log('✅ Connection successful!');
  console.log('Result:', result);
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error('Error code:', error.code);
}
