-- Add show_citations column to users table
ALTER TABLE users ADD COLUMN show_citations INTEGER NOT NULL DEFAULT 0;

-- Create citations table
CREATE TABLE citations (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	step_id INTEGER NOT NULL,
	title TEXT NOT NULL,
	url TEXT NOT NULL,
	order_index INTEGER NOT NULL,
	created_at NUMERIC DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE
);
