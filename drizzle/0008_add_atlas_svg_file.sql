-- Add atlas_svg_file column to sequences and steps tables
ALTER TABLE sequences ADD COLUMN atlas_svg_file TEXT;
ALTER TABLE steps ADD COLUMN atlas_svg_file TEXT;
-- Set default value for existing sequences
UPDATE sequences SET atlas_svg_file = 'tim_taylor.svg';
