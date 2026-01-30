# Database Migration History

This file tracks the relationship between code versions and database migrations.

## Current State
- **Code Version**: v1.0.0
- **Migration**: 0004_add_draft_publishing_columns.sql
- **Date**: janvier 30, 2026

## Version History


### v1.0.0 - janvier 30, 2026
- **Migration**: 0004_add_draft_publishing_columns.sql
- **Changes**: 
  site works on vercel after debug, db 0004_add_draft_publishing_columns.sql
- **Rollback Instructions**: 
  1. Checkout code: `git checkout v1.0.0`
  2. Check database migration compatibility in MIGRATIONS.md
### v1.0.0 - January 30, 2026
- **Migration**: 0004_add_draft_publishing_columns.sql
- **Changes**: 
  - Added draft/publish workflow columns to sequences table
  - Added `published_version_id`, `is_published_version`, `currently_edited_by`, `last_edited_at`
  - Fixed HCaptcha SSR crash with dynamic imports
- **Database Backup**: Create before upgrading from v0.x
- **Rollback Instructions**: 
  1. Checkout code: `git checkout v1.0.0`
  2. Database is at migration 0004 - no rollback needed if coming from v0.9.0

### v0.9.0 - Previous (Example)
- **Migration**: 0004_add_draft_publishing_columns.sql
- **Changes**: Email verification and password reset functionality

## Migration Commands

### Apply migrations
```bash
npm run drizzle:migrate
```

### Check current migration status
```bash
node scripts/check_migration_status.js
```

### Create new migration
```bash
npx drizzle-kit generate
```

## Important Notes

⚠️ **Never rollback code without considering database compatibility**

- Code at v1.0.0 requires migration 0004 or higher
- Code at v0.9.0 requires migration 0003 or higher
- Rolling back code may require manual database migration rollback
- Always backup database before major version changes

## Backup Strategy

### Production (Turso)
```bash
# Create backup
turso db shell your-database-name ".backup backup-$(date +%Y%m%d).db"

# List backups
turso db list
```

### Local Development
```bash
# Copy database file
cp data/app.db data/app-backup-$(date +%Y%m%d).db
```

