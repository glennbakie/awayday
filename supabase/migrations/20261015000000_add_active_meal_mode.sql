-- Add active_meal_mode column to team_trips
ALTER TABLE team_trips ADD COLUMN IF NOT EXISTS active_meal_mode TEXT DEFAULT 'auto';

-- Enable Realtime replication for team_trips
ALTER PUBLICATION supabase_realtime ADD TABLE team_trips;

-- Ensure test-team has active_meal_mode initialized
UPDATE team_trips SET active_meal_mode = 'auto' WHERE share_slug = 'test-team' AND (active_meal_mode IS NULL OR active_meal_mode = '');
