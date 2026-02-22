import { type Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required (Turso database URL)');
}

// For Turso, we need to use a libsql URL
// The authToken is used at runtime by the drizzle client, not by drizzle-kit
export default {
  schema: './drizzle/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  breakpoints: true,
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config;