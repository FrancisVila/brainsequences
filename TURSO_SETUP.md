# Turso Database Migration Guide

Your application is now configured to use Turso instead of local SQLite. Follow these steps to complete the setup.

## What Changed

✅ **Installed**: `@libsql/client` package for Turso connectivity
✅ **Updated**: [app/server/drizzle.ts](app/server/drizzle.ts) now uses Turso instead of local SQLite
✅ **Added**: Environment variables `DATABASE_URL` and `DATABASE_AUTH_TOKEN` to `.env`

## Next Steps

### 1. Create a Turso Account

1. Go to https://turso.tech
2. Sign up with GitHub (recommended) or email
3. Verify your email if needed

### 2. Create a Database

**Using the Web Dashboard:**

1. Go to https://turso.tech/app
2. Click "Create Database"
3. Choose a name (e.g., `brainsequences`)
4. Select a location close to your users
5. Click "Create"

**Or using CLI (if you manage to install it):**

```bash
turso auth signup
turso db create brainsequences
```

### 3. Get Your Connection Credentials

**From the Web Dashboard:**

1. Click on your database name
2. Copy the **Database URL** (looks like `libsql://your-db.turso.io`)
3. Click "Show Auth Token" and copy the token

**Or using CLI:**

```bash
turso db show brainsequences --url
turso db tokens create brainsequences
```

### 4. Update Your `.env` File

Replace the placeholder values in `.env`:

```bash
DATABASE_URL=libsql://your-database-name.turso.io
DATABASE_AUTH_TOKEN=your-actual-auth-token
```

### 5. Migrate Your Existing Data to Turso

You have several options:

#### Option A: Using Turso CLI (Recommended)

```bash
# Upload your local database to Turso
turso db shell brainsequences < data/app.db
```

#### Option B: Using the Web Dashboard

1. In your Turso dashboard, click on your database
2. Go to the "Data" tab
3. Use the SQL console to run your schema migrations
4. Then manually import data using INSERT statements

#### Option C: Export/Import via SQL

```bash
# Export your current database to SQL
sqlite3 data/app.db .dump > backup.sql

# Then use Turso CLI to import
turso db shell brainsequences < backup.sql
```

#### Option D: Start Fresh and Migrate Schema Only

If you don't have critical data to preserve:

```bash
# Update drizzle config to point to Turso
# Then push the schema
npx drizzle-kit push
```

### 6. Test Local Development

```bash
npm run dev
```

Visit http://localhost:5173 and verify:
- Existing sequences load (if you migrated data)
- You can create new sequences
- You can edit sequences

### 7. Configure Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your `brainsequences` project
3. Go to Settings → Environment Variables
4. Add these variables:
   - `DATABASE_URL` = your Turso database URL
   - `DATABASE_AUTH_TOKEN` = your Turso auth token
5. Make sure they're enabled for all environments (Production, Preview, Development)

### 8. Deploy to Vercel

```bash
vercel --prod
```

Or push to your Git repository if you have automatic deployments enabled.

## Benefits You Now Have

✅ **Persistent Data**: Sequences created on production won't be lost on deployment
✅ **Shared Database**: Same data accessible from localhost and production
✅ **No Sync Issues**: Create sequences anywhere, they're immediately available everywhere
✅ **Better Performance**: Turso is optimized for edge deployments
✅ **Free Tier**: 500 databases, 9GB storage, billions of row reads

## Troubleshooting

### Error: "DATABASE_URL environment variable is required"

Make sure your `.env` file has the correct values and is in the project root.

### Cannot connect to Turso

- Verify your auth token is correct
- Check that your database URL starts with `libsql://`
- Make sure you're not behind a firewall blocking the connection

### Schema mismatches

If your local database schema differs from what's in Turso:

```bash
# Push your current schema to Turso
npx drizzle-kit push
```

### Want to keep both local and Turso?

You can create a local fallback by checking if DATABASE_URL is set:

```typescript
// In app/server/drizzle.ts
const useTurso = process.env.DATABASE_URL;

if (useTurso) {
  // Use Turso
} else {
  // Fall back to local SQLite
}
```

## Additional Resources

- Turso Documentation: https://docs.turso.tech
- Drizzle + Turso Guide: https://orm.drizzle.team/docs/get-started-sqlite#turso
- Turso CLI Reference: https://docs.turso.tech/reference/turso-cli

## Rollback

If you need to revert to local SQLite temporarily, restore the original [app/server/drizzle.ts](app/server/drizzle.ts):

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data', 'app.db');
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema: { ...schema, ...relations } });
export const rawDb = sqlite;
```
