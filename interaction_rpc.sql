-- Secure Mission Interaction RPC
-- Allows players to affect other players (targets) ONLY if they have a valid mission.

CREATE OR REPLACE FUNCTION apply_mission_outcome(
    p_mission_id UUID,
    p_target_id UUID,
    p_is_planet BOOLEAN,
    p_log_entry JSONB,
    p_resources_diff JSONB DEFAULT '{}'::JSONB,
    p_debris_diff JSONB DEFAULT '{}'::JSONB,
    p_ships_new JSONB DEFAULT NULL,
    p_defenses_new JSONB DEFAULT NULL,
    p_buildings_new JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
SET search_path = public -- Secure search path
AS $$
DECLARE
    v_mission_check UUID;
    v_current_resources JSONB;
    v_current_debris JSONB;
    v_current_logs JSONB;
    v_current_ships JSONB;
    v_current_defenses JSONB;
    v_current_buildings JSONB;
    
    v_new_resources JSONB;
    v_new_debris JSONB;
    v_new_logs JSONB;
    v_new_ships JSONB;
    v_new_defenses JSONB;
    v_new_buildings JSONB;
    
    -- Diff values
    v_diff_metal NUMERIC;
    v_diff_crystal NUMERIC;
    v_diff_deut NUMERIC;
    v_diff_deb_met NUMERIC;
    v_diff_deb_crys NUMERIC;
BEGIN
    -- 1. Security: Check if the calling user owns the mission and it targets the p_target_id
    SELECT id INTO v_mission_check
    FROM missions
    WHERE id = p_mission_id 
    AND owner_id = auth.uid() 
    AND (target_user_id = p_target_id OR EXISTS (SELECT 1 FROM planets WHERE id = p_target_id AND owner_id = target_user_id));

    IF v_mission_check IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: You do not own a valid mission targeting this entity.';
    END IF;

    -- Extract diff values
    v_diff_metal := COALESCE((p_resources_diff->>'metal')::numeric, 0);
    v_diff_crystal := COALESCE((p_resources_diff->>'crystal')::numeric, 0);
    v_diff_deut := COALESCE((p_resources_diff->>'deuterium')::numeric, 0);
    
    v_diff_deb_met := COALESCE((p_debris_diff->>'metal')::numeric, 0);
    v_diff_deb_crys := COALESCE((p_debris_diff->>'crystal')::numeric, 0);

    -- 2. FETCH CURRENT DATA
    IF p_is_planet THEN
        SELECT resources, debris, mission_logs, ships, defenses, buildings
        INTO v_current_resources, v_current_debris, v_current_logs, v_current_ships, v_current_defenses, v_current_buildings
        FROM planets WHERE id = p_target_id;
        
        IF NOT FOUND THEN RAISE EXCEPTION 'Target planet not found'; END IF;
    ELSE
        SELECT resources, debris, mission_logs, ships, defenses, buildings
        INTO v_current_resources, v_current_debris, v_current_logs, v_current_ships, v_current_defenses, v_current_buildings
        FROM profiles WHERE id = p_target_id;
        
        IF NOT FOUND THEN RAISE EXCEPTION 'Target profile not found'; END IF;
    END IF;

    -- 3. APPLY CALCULATIONS

    -- Resources (Diff)
    v_new_resources := v_current_resources;
    IF v_current_resources IS NULL THEN v_new_resources := '{}'::JSONB; END IF;
    IF v_new_resources->'storage' IS NULL THEN
        v_new_resources := jsonb_set(v_new_resources, '{storage}', '{"metal":10000,"crystal":10000,"deuterium":10000}'::jsonb);
    END IF;
    v_new_resources := jsonb_set(v_new_resources, '{metal}', to_jsonb(GREATEST(0, COALESCE((v_current_resources->>'metal')::numeric, 0) + v_diff_metal)));
    v_new_resources := jsonb_set(v_new_resources, '{crystal}', to_jsonb(GREATEST(0, COALESCE((v_current_resources->>'crystal')::numeric, 0) + v_diff_crystal)));
    v_new_resources := jsonb_set(v_new_resources, '{deuterium}', to_jsonb(GREATEST(0, COALESCE((v_current_resources->>'deuterium')::numeric, 0) + v_diff_deut)));

    -- Debris (Diff)
    v_new_debris := v_current_debris;
    IF v_new_debris IS NULL THEN v_new_debris := '{"metal":0,"crystal":0}'::JSONB; END IF;
    v_new_debris := jsonb_set(v_new_debris, '{metal}', to_jsonb(GREATEST(0, COALESCE((v_new_debris->>'metal')::numeric, 0) + v_diff_deb_met)));
    v_new_debris := jsonb_set(v_new_debris, '{crystal}', to_jsonb(GREATEST(0, COALESCE((v_new_debris->>'crystal')::numeric, 0) + v_diff_deb_crys)));

    -- Logs (Append)
    IF v_current_logs IS NULL OR jsonb_typeof(v_current_logs) != 'array' THEN
        v_current_logs := '[]'::JSONB;
    END IF;
    v_new_logs := (jsonb_build_array(p_log_entry) || v_current_logs);

    -- Fleet/Defense/Buildings (Override if provided)
    v_new_ships := COALESCE(p_ships_new, v_current_ships);
    v_new_defenses := COALESCE(p_defenses_new, v_current_defenses);
    v_new_buildings := COALESCE(p_buildings_new, v_current_buildings);

    -- 4. UPDATE
    IF p_is_planet THEN
        UPDATE planets 
        SET resources = v_new_resources,
            debris = v_new_debris,
            mission_logs = v_new_logs,
            ships = v_new_ships,
            defenses = v_new_defenses,
            buildings = v_new_buildings
        WHERE id = p_target_id;
    ELSE
        UPDATE profiles 
        SET resources = v_new_resources,
            debris = v_new_debris,
            mission_logs = v_new_logs,
            ships = v_new_ships,
            defenses = v_new_defenses,
            buildings = v_new_buildings,
            version = COALESCE(version, 1) + 1,
            last_updated = extract(epoch from now()) * 1000
        WHERE id = p_target_id;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;
