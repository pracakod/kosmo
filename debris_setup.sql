-- DEBRIS FIELD MIGRATION
-- Adds debris storage to planets and profiles (Main Planets)

-- 1. Add debris column to profiles (Main Planets)
-- Stores { "metal": 0, "crystal": 0 }
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS debris JSONB DEFAULT '{"metal": 0, "crystal": 0}'::jsonb;

-- 2. Add debris column to planets (Colonies)
ALTER TABLE planets 
ADD COLUMN IF NOT EXISTS debris JSONB DEFAULT '{"metal": 0, "crystal": 0}'::jsonb;

-- 3. Update existing rows to have default empty debris (optional, default handles new ones)
UPDATE profiles SET debris = '{"metal": 0, "crystal": 0}'::jsonb WHERE debris IS NULL;
UPDATE planets SET debris = '{"metal": 0, "crystal": 0}'::jsonb WHERE debris IS NULL;
