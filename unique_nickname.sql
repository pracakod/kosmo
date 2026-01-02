-- UNIQUE NICKNAME MIGRATION
-- Safely adds unique constraint on nicknames without breaking existing accounts

-- STEP 1: Find and fix duplicate nicknames
-- Newer players with duplicates get a suffix added to their nickname
-- Older players keep their original nickname

UPDATE profiles p1
SET nickname = p1.nickname || '_' || SUBSTR(p1.id::text, 1, 4)
WHERE EXISTS (
    SELECT 1 FROM profiles p2 
    WHERE LOWER(p2.nickname) = LOWER(p1.nickname)  -- Case-insensitive comparison
    AND p2.id != p1.id
    AND p2.created_at < p1.created_at  -- Older player keeps original
);

-- STEP 2: Add unique constraint (case-insensitive via lower index)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_nickname_unique_lower 
ON profiles (LOWER(nickname));

-- STEP 3: Add regular unique constraint as backup
ALTER TABLE profiles 
ADD CONSTRAINT profiles_nickname_unique UNIQUE (nickname);
