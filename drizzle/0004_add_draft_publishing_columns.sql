-- Migration: Add draft/publishing management columns
-- Date: 2026-01-29

-- Add columns to sequences table for draft/publish workflow
ALTER TABLE sequences ADD COLUMN published_version_id INTEGER REFERENCES sequences(id) ON DELETE SET NULL;
ALTER TABLE sequences ADD COLUMN is_published_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sequences ADD COLUMN currently_edited_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE sequences ADD COLUMN last_edited_at NUMERIC;

-- Add draft column to steps table to mirror parent sequence status
ALTER TABLE steps ADD COLUMN draft INTEGER NOT NULL DEFAULT 1;

-- Update existing records: set is_published_version=1 for all currently published sequences (draft=0)
UPDATE sequences SET is_published_version = 1 WHERE draft = 0;

-- Update existing steps to match their parent sequence's draft status
UPDATE steps SET draft = (
    SELECT sequences.draft 
    FROM sequences 
    WHERE sequences.id = steps.sequence_id
);
