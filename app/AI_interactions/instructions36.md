# 1. Ensure all changes are committed
git status

# 2. Note your current migration
# (It's 0004_add_draft_publishing_columns.sql based on your drizzle folder)

# 3. Backup production database (if using Turso)
turso db shell brainsequences ".backup backup-v1.0.0-$(date +%Y%m%d).db"

# 4. Update MIGRATIONS.md with the current state (already created above)

# 5. Create git tag
git tag -a v1.0.0 -m "(message)"

# 6. Push tag to remote
git push origin v1.0.0

# 7. Optional: Create GitHub release for better visibility
