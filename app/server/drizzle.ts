import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../../drizzle/schema';
import * as relations from '../../drizzle/relations';

// Use Turso database with environment variables
const tursoUrl = process.env.DATABASE_URL;
const tursoAuthToken = process.env.DATABASE_AUTH_TOKEN;

if (!tursoUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create the libsql client for Turso
const tursoClient = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

// Create the drizzle database instance with schema for query API
// Must include both tables and relations for relational queries to work
export const db = drizzle(tursoClient, { schema: { ...schema, ...relations } });

// Export the raw libsql client for cases where we need it
export const rawDb = tursoClient;

// Re-export types
export type * from '../../drizzle/schema';
export * from '../../drizzle/schema';
export * from '../../drizzle/relations';