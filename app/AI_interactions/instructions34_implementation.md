# Draft/Publish Workflow Implementation - Strategy 1

## Schema Changes

### Sequences Table
Added columns:
- `published_version_id`: References the published version if this record is a draft
- `is_published_version`: 1 if this is the live published version, 0 for drafts
- `currently_edited_by`: User ID for edit locking (Phase 2)
- `last_edited_at`: Timestamp for conflict detection

### Steps Table
Added column:
- `draft`: Mirrors parent sequence's draft status (0 = published, 1 = draft)

## How It Works

### Creating a New Sequence (Draft)
1. User creates sequence → stored with `draft=1`, `is_published_version=0`
2. All steps inherit `draft=1`
3. Only visible to creator (via `userId`) and collaborators

### Publishing a Sequence
1. Set `draft=0` and `is_published_version=1`
2. Update all child steps: `draft=0`
3. Now visible to all users

### Editing a Published Sequence
1. Create a **new sequence record** (copy of published version)
   - Set `draft=1`, `is_published_version=0`
   - Set `published_version_id` = ID of published version
   - Copy `userId` from original
2. Copy all steps with `draft=1`
3. Copy all relations (step_brainparts, arrows, step_links)
4. User edits this draft version

### Publishing Edits
1. Within a transaction:
   - Delete the old published version and its steps (cascade)
   - Set draft version to: `draft=0`, `is_published_version=1`, `published_version_id=NULL`
   - Update all steps: `draft=0`
2. The draft becomes the new published version

### Phase 2: Edit Locking
Before allowing edit:
1. Check if `currently_edited_by` is set on any draft for this sequence
2. If set and not current user → show "another user is editing" message
3. If set and is current user → ask "continue or start fresh?"
4. When user starts editing: set `currently_edited_by` and `last_edited_at`
5. When user publishes or cancels: clear `currently_edited_by`

## Queries

### Show all published sequences (public)
```sql
SELECT * FROM sequences WHERE draft = 0 AND is_published_version = 1
```

### Show user's draft sequences
```sql
SELECT * FROM sequences 
WHERE draft = 1 AND userId = ?
```

### Show sequences user can edit (owner + collaborator)
```sql
SELECT s.* FROM sequences s
LEFT JOIN sequence_collaborators sc ON s.id = sc.sequence_id
WHERE s.draft = 1 AND (s.userId = ? OR sc.userId = ?)
```

### Find draft of a published sequence
```sql
SELECT * FROM sequences 
WHERE published_version_id = ? AND draft = 1
```

### Check if sequence is being edited
```sql
SELECT currently_edited_by, last_edited_at 
FROM sequences 
WHERE id = ? AND currently_edited_by IS NOT NULL
```

## Benefits
- No data duplication at rest (only during active editing)
- Foreign keys work normally (all reference step IDs consistently)
- Simple queries with standard WHERE clauses
- Easy to implement with existing codebase
- Built on top of existing `draft` column
- Clean separation between drafts and published versions





when i click Publish, I get an error

Failed to load url ../../server/auth (resolved id: ../../server/auth) in C:/projects/brainsequences/brainsequences/app/routes/api/sequences/publish.js. Does the file exist?

Click outside, press Esc key, or fix the code to dismiss.
You can also disable this overlay by setting server.hmr.overlay to false in vite.config.ts.

The import paths are incorrect. Let me fix them:

Edited
publish.js+4-4
The import paths are now corrected. The Publish button should work now - try clicking it again!