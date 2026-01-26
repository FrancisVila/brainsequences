import { type Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  breakpoints: true,
  dbCredentials: {
    url: process.env.DATABASE_URL || './data/app.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config;