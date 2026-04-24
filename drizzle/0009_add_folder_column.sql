-- Migration: Add folder column to brainparts table
ALTER TABLE brainparts ADD COLUMN folder INTEGER NOT NULL DEFAULT 0;
