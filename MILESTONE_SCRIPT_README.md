# Milestone Management Scripts

This directory contains scripts for creating and managing project milestones.

## create-milestone.ps1

PowerShell script that automates the milestone creation process.

### Features

- ✅ Automatically detects latest version and suggests next version
- ✅ Semantic versioning support (major.minor.patch)
- ✅ Detects current database migration
- ✅ Updates MIGRATIONS.md automatically
- ✅ Creates annotated git tag
- ✅ Optional: Push to remote
- ✅ Optional: Create database backup (local or Turso)

### Usage

```powershell
# Run the script
.\create-milestone.ps1

# Or from PowerShell
pwsh create-milestone.ps1
```

### Interactive Prompts

The script will guide you through:

1. **Version Selection**: Choose patch/minor/major bump or custom version
2. **Message**: Enter a multi-line description of changes
3. **Confirmation**: Review before creating
4. **Push**: Choose to push tag immediately or later
5. **Backup**: Optionally backup local or Turso database

### Example Session

```
=== Brainsequences Milestone Creator ===

Latest tag: v0.9.0

Suggested versions:
  1. v0.9.1 (patch - bug fixes)
  2. v0.10.0 (minor - new features)
  3. v1.0.0 (major - breaking changes)
  4. Custom version

Select version type (1-4): 3

Latest migration: 0004_add_draft_publishing_columns.sql

Enter milestone description:
Fixed HCaptcha SSR crash
Added draft/publish workflow
(Press Enter twice to finish)

=== Milestone Summary ===
Version:      v1.0.0
Migration:    0004_add_draft_publishing_columns.sql
Message:      Fixed HCaptcha SSR crash
              Added draft/publish workflow

Create this milestone? (y/n): y

✓ Updated MIGRATIONS.md
✓ Created tag v1.0.0
✓ Committed MIGRATIONS.md
✓ Pushed tag to remote

=== Milestone Created Successfully! ===
```

### What It Does

1. Checks for uncommitted changes (warns if found)
2. Finds latest git tag and suggests next version
3. Detects current database migration from `/drizzle` folder
4. Prompts for milestone description
5. Updates `MIGRATIONS.md` with new entry
6. Creates annotated git tag with message and migration info
7. Commits MIGRATIONS.md changes
8. Optionally pushes tag and commits to remote
9. Optionally creates database backup

### Requirements

- Git
- PowerShell 5.0+ or PowerShell Core
- Optional: Turso CLI (for Turso backups)

### Notes

- Version format must be: `v1.2.3` (with or without 'v' prefix)
- Tag will be annotated with full message and migration info
- MIGRATIONS.md will be automatically updated with new version entry
- Script will abort if uncommitted changes exist (with option to continue)
