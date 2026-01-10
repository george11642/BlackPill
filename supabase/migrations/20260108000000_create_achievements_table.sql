-- Create achievements master table for achievement definitions
-- This table stores the static achievement data that user_achievements references

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  icon_url TEXT,
  category TEXT DEFAULT 'analysis',
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Public read policy - all authenticated users can view achievements
CREATE POLICY "Achievements are publicly readable"
  ON achievements FOR SELECT TO authenticated USING (true);

-- Insert achievement definitions (matching edge function definitions)
INSERT INTO achievements (key, name, description, emoji, category, points) VALUES
  ('first_scan', 'First Steps', 'Complete your first analysis', '📸', 'analysis', 10),
  ('score_8_plus', 'Rising Star', 'Achieve a score of 8.0 or higher', '⭐', 'analysis', 25),
  ('score_9_plus', 'Elite Status', 'Achieve a score of 9.0 or higher', '👑', 'analysis', 50),
  ('scans_5', 'Getting Started', 'Complete 5 analyses', '📊', 'analysis', 15),
  ('scans_10', 'Committed', 'Complete 10 analyses', '🎯', 'analysis', 20),
  ('scans_25', 'Dedicated', 'Complete 25 analyses', '💪', 'analysis', 30),
  ('scans_50', 'Obsessed', 'Complete 50 analyses', '🔥', 'analysis', 50)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  category = EXCLUDED.category,
  points = EXCLUDED.points;

-- Add achievement_id column to user_achievements if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_achievements' AND column_name = 'achievement_id'
  ) THEN
    ALTER TABLE user_achievements ADD COLUMN achievement_id UUID REFERENCES achievements(id);
  END IF;
END $$;

-- Backfill achievement_id from achievement_key for existing records
UPDATE user_achievements ua
SET achievement_id = a.id
FROM achievements a
WHERE ua.achievement_key = a.key AND ua.achievement_id IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievements_key ON achievements(key);
