import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';

// Re-use the existing database path
const dbPath = path.resolve(process.cwd(), 'data', 'app.db');
const sqlite = new Database(dbPath);

// Create the drizzle database instance
export const db = drizzle(sqlite);

// Export the raw better-sqlite3 instance for cases where we need it
export const rawDb = sqlite;

// Re-export types
export type * from '../../drizzle/schema';
export * from '../../drizzle/schema';
export * from '../../drizzle/relations';