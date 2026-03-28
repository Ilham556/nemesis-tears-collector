-- ============================================================================
-- NEMESIS TEARS COLLECTOR - SUPABASE SETUP
-- ============================================================================
-- Run this SQL in the Supabase SQL Editor to configure your database

-- 1. Create the stats table for global tear counts
CREATE TABLE IF NOT EXISTS stats (
  id BIGINT PRIMARY KEY,
  total_tears BIGINT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Initialize stats
INSERT INTO stats (id, total_tears) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- 2. Create the tears table to store individual points
CREATE TABLE IF NOT EXISTS tears (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_session_id TEXT NOT NULL,
  nemesis_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tears_user ON tears(user_session_id);
CREATE INDEX IF NOT EXISTS idx_tears_nemesis ON tears(nemesis_id);
CREATE INDEX IF NOT EXISTS idx_tears_created_at ON tears(created_at DESC);

-- 3. Create increment_tears function
CREATE OR REPLACE FUNCTION increment_tears(amount BIGINT DEFAULT 1)
RETURNS BIGINT AS $$
BEGIN
  UPDATE stats SET total_tears = total_tears + amount WHERE id = 1;
  RETURN (SELECT total_tears FROM stats WHERE id = 1);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tears ENABLE ROW LEVEL SECURITY;

-- Stats table: Allow anonymous users to SELECT
DROP POLICY IF EXISTS stats_select_policy ON stats;
CREATE POLICY stats_select_policy ON stats
  FOR SELECT
  USING (true);

-- Tears table: Allow anonymous users to INSERT
DROP POLICY IF EXISTS tears_insert_policy ON tears;
CREATE POLICY tears_insert_policy ON tears
  FOR INSERT
  WITH CHECK (true);

-- Tears table: Allow anonymous users to SELECT
DROP POLICY IF EXISTS tears_select_policy ON tears;
CREATE POLICY tears_select_policy ON tears
  FOR SELECT
  USING (true);

-- ============================================================================
-- NOTES:
-- - Stats table stores the global tear counter
-- - Tears table stores each individual point/action
-- - All operations are allowed for anonymous users (public access)
-- - RLS policies are minimal to allow the Supabase anonymous key to work
-- ============================================================================
