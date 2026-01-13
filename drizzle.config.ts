import { type Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  breakpoints: true,
  dbCredentials: {
    url: './data/app.db',
  },
} satisfies Config;