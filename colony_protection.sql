-- COLONY PROTECTION CONSTRAINTS
-- Run this in Supabase SQL Editor to preventing duplicate planets

-- 1. Constraint for COLONIES (planets table)
-- We use a functional index on the JSONB keys because galaxy_coords is a JSONB column.
CREATE UNIQUE INDEX IF NOT EXISTS idx_planets_unique_coords 
ON planets (
    (galaxy_coords->>'galaxy'), 
    (galaxy_coords->>'system'), 
    (galaxy_coords->>'position')
);

-- 2. Constraint for MAIN PLANETS (profiles table)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_coords 
ON profiles (
    (galaxy_coords->>'galaxy'), 
    (galaxy_coords->>'system'), 
    (galaxy_coords->>'position')
);

-- Note: This does not prevent a "Main Planet" from overlapping a "Colony" purely via DB constraints 
-- if they are in different tables, unless we verify across tables (Triggers).
-- However, given the app logic checks both, these indices prevent "Double Colony" or "Double Main" issues.
-- Cross-table consistency relies on the application logic (which we verified is present).
