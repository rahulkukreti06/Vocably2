-- Add the created_by_name column to the rooms table in Supabase
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS created_by_name text;
