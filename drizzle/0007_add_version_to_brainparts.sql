-- Add version column to brainparts table (default 1 for all existing items)
ALTER TABLE brainparts ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
