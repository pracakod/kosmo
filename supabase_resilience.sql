-- 1. Add version column to profiles and planets
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
ALTER TABLE planets ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;

-- 2. Create RPC function for atomic save
CREATE OR REPLACE FUNCTION save_game_atomic(
    p_user_id UUID,
    p_profile_data JSONB,
    p_planet_id UUID DEFAULT NULL,
    p_planet_data JSONB DEFAULT NULL,
    p_expected_version INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    current_version INT;
    new_version INT;
    result_json JSONB;
BEGIN
    -- Check current version of the profile
    SELECT version INTO current_version FROM profiles WHERE id = p_user_id;
    
    -- Initialize version if null
    IF current_version IS NULL THEN
        current_version := 1;
    END IF;

    -- Optimistic Locking Check
    IF current_version != p_expected_version THEN
        RAISE EXCEPTION 'VERSION_MISMATCH: Expected %, but found %', p_expected_version, current_version;
    END IF;

    new_version := current_version + 1;

    -- Update Profile (Always)
    UPDATE profiles 
    SET 
        resources = COALESCE((p_profile_data->>'resources')::jsonb, resources),
        buildings = COALESCE((p_profile_data->>'buildings')::jsonb, buildings),
        research = COALESCE((p_profile_data->>'research')::jsonb, research),
        ships = COALESCE((p_profile_data->>'ships')::jsonb, ships),
        defenses = COALESCE((p_profile_data->>'defenses')::jsonb, defenses),
        production_settings = COALESCE((p_profile_data->>'production_settings')::jsonb, production_settings),
        active_missions = COALESCE((p_profile_data->>'active_missions')::jsonb, active_missions),
        mission_logs = COALESCE((p_profile_data->>'mission_logs')::jsonb, mission_logs),
        galaxy_coords = COALESCE((p_profile_data->>'galaxy_coords')::jsonb, galaxy_coords),
        updated_at = NOW(),
        last_updated = (p_profile_data->>'last_updated')::bigint,
        version = new_version
    WHERE id = p_user_id;

    -- Update Planet (If provided - Colony Save)
    IF p_planet_id IS NOT NULL AND p_planet_data IS NOT NULL THEN
        UPDATE planets
        SET
            resources = COALESCE((p_planet_data->>'resources')::jsonb, resources),
            buildings = COALESCE((p_planet_data->>'buildings')::jsonb, buildings),
            ships = COALESCE((p_planet_data->>'ships')::jsonb, ships),
            defenses = COALESCE((p_planet_data->>'defenses')::jsonb, defenses),
            construction_queue = COALESCE((p_planet_data->>'construction_queue')::jsonb, construction_queue),
            shipyard_queue = COALESCE((p_planet_data->>'shipyard_queue')::jsonb, shipyard_queue),
            updated_at = NOW(),
            version = version + 1 -- Independent versioning for planets, just increment
        WHERE id = p_planet_id;
    END IF;

    -- Return new version
    result_json := jsonb_build_object('success', true, 'new_version', new_version);
    RETURN result_json;

EXCEPTION WHEN OTHERS THEN
    -- If custom exception, re-raise
    IF SQLERRM LIKE 'VERSION_MISMATCH%' THEN
        RAISE;
    END IF;
    -- Otherwise generic error
    RAISE EXCEPTION 'Transaction Failed: %', SQLERRM;
END;
$$;
