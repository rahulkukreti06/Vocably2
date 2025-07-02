-- Migration: Change created_by column from uuid to text to support non-UUID user IDs (e.g., Google IDs)
ALTER TABLE rooms
ALTER COLUMN created_by TYPE text USING created_by::text;
