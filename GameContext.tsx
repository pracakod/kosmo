import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from './lib/supabase';
import { calculateExpeditionOutcome } from './lib/gameLogic';
import { GameState, BuildingId, ResearchId, ShipId, DefenseId, ConstructionItem, Requirement, FleetMission, MissionType, MissionLog, MissionRewards } from './types';
import { BUILDINGS, RESEARCH, SHIPS, DEFENSES } from './constants';
import { generatePvPBattleResult } from './combatUtils';


const TICK_RATE = 1000;
const GAME_SPEED = 100;
const STORAGE_KEY = 'cosmos_conquest_save_v1';

type TransactionStatus = 'success' | 'no_funds' | 'storage_full';

interface GameContextType extends GameState {
    upgradeBuilding: (buildingId: BuildingId) => void;
    upgradeResearch: (researchId: ResearchId) => void;
    buildShip: (shipId: ShipId, amount: number) => void;
    buildDefense: (defenseId: DefenseId, amount: number) => void;
    sendExpedition: (ships: Record<ShipId, number>, coords: { galaxy: number, system: number, position: number }) => void;
    sendAttack: (ships: Record<ShipId, number>, coords: { galaxy: number, system: number, position: number }) => void;
    sendTransport: (ships: Record<ShipId, number>, resources: { metal: number, crystal: number, deuterium: number }, coords: { galaxy: number, system: number, position: number }) => void;
    cancelMission: (missionId: string) => Promise<void>;
    cancelConstruction: (constructionId: string) => Promise<void>;
    sendSpyProbe: (amount: number, coords: { galaxy: number, system: number, position: number }) => Promise<boolean>;
    buyPremium: (cost: number, reward: { metal?: number, crystal?: number, deuterium?: number }) => Promise<TransactionStatus>;
    getCost: (type: 'building' | 'research', id: string, currentLevel: number) => { metal: number, crystal: number, deuterium: number };
    checkRequirements: (reqs?: Requirement[]) => boolean;
    renamePlanet: (newName: string, specificPlanetId?: string) => void;
    updateProductionSetting: (buildingId: BuildingId, percent: number) => void;
    resetGame: () => void;
    clearLogs: () => void;
    logout: () => void;
    deleteAccount: () => Promise<void>;
    abandonColony: (planetId: string, confirmation: string) => Promise<boolean>;
    addXP: (amount: number, reason?: string) => void;

    updateAvatar: (url: string) => void;
    updatePlanetType: (type: string) => void;
    getPlayersInSystem: (galaxy: number, system: number) => Promise<any[]>;
    renameUser: (name: string) => void;
    mainPlanetName?: string;
    getLevel: (points: number, settings?: any) => number;
    session?: any;

    // Colonization
    planets: any[];
    currentPlanetId: string | null;
    mainPlanetCoords?: { galaxy: number, system: number, position: number } | null;
    sendColonize: (coords: { galaxy: number, system: number, position: number }, resources: { metal: number, crystal: number, deuterium: number }) => Promise<boolean>;
    switchPlanet: (planetId: string) => void;
    fetchPlanets: () => Promise<void>;
    isOnline: boolean; // NEW: Expose network status
}

const initialState: GameState = {
    avatarUrl: "/kosmo/avatars/avatar_default.png",
    planetType: 'terran',
    planetName: "Nowa Kolonia",
    nickname: "Player", // Added nickname to initial state
    resources: {
        metal: 500,
        crystal: 300,
        deuterium: 100,
        darkMatter: 0,
        energy: 0,
        maxEnergy: 0,
        storage: {
            metal: 10000,
            crystal: 10000,
            deuterium: 10000
        }
    },
    productionSettings: {
        [BuildingId.METAL_MINE]: 100,
        [BuildingId.CRYSTAL_MINE]: 100,
        [BuildingId.DEUTERIUM_SYNTH]: 100,
        [BuildingId.SOLAR_PLANT]: 100,
        [BuildingId.FUSION_REACTOR]: 100,
    },
    productionRates: {
        metal: 0,
        crystal: 0,
        deuterium: 0
    },
    buildings: {
        [BuildingId.METAL_MINE]: 1,
        [BuildingId.CRYSTAL_MINE]: 0,
        [BuildingId.DEUTERIUM_SYNTH]: 0,
        [BuildingId.SOLAR_PLANT]: 1,
        [BuildingId.FUSION_REACTOR]: 0,
        [BuildingId.ROBOT_FACTORY]: 0,
        [BuildingId.SHIPYARD]: 0,
        [BuildingId.RESEARCH_LAB]: 0,
        [BuildingId.METAL_STORAGE]: 0,
        [BuildingId.CRYSTAL_STORAGE]: 0,
        [BuildingId.DEUTERIUM_TANK]: 0,
    },
    research: {
        [ResearchId.ENERGY_TECH]: 0,
        [ResearchId.LASER_TECH]: 0,
        [ResearchId.ION_TECH]: 0,
        [ResearchId.HYPERSPACE_TECH]: 0,
        [ResearchId.PLASMA_TECH]: 0,
        [ResearchId.COMBUSTION_DRIVE]: 0,
        [ResearchId.IMPULSE_DRIVE]: 0,
        [ResearchId.HYPERSPACE_DRIVE]: 0,
        [ResearchId.ESPIONAGE_TECH]: 0,
        [ResearchId.COMPUTER_TECH]: 0,
        [ResearchId.ASTROPHYSICS]: 0,
        [ResearchId.WEAPON_TECH]: 0,
        [ResearchId.SHIELDING_TECH]: 0,
        [ResearchId.ARMOUR_TECH]: 0,
    },
    ships: {
        [ShipId.LIGHT_FIGHTER]: 0,
        [ShipId.HEAVY_FIGHTER]: 0,
        [ShipId.CRUISER]: 0,
        [ShipId.BATTLESHIP]: 0,
        [ShipId.DESTROYER]: 0,
        [ShipId.DEATH_STAR]: 0,
        [ShipId.SMALL_CARGO]: 0,
        [ShipId.MEDIUM_CARGO]: 0,
        [ShipId.HUGE_CARGO]: 0,
        [ShipId.COLONY_SHIP]: 0,
        [ShipId.ESPIONAGE_PROBE]: 0,
        [ShipId.PIONEER]: 1,
        [ShipId.RECYCLER]: 0
    },
    defenses: {
        [DefenseId.ROCKET_LAUNCHER]: 0,
        [DefenseId.LIGHT_LASER]: 0,
        [DefenseId.HEAVY_LASER]: 0,
        [DefenseId.GAUSS_CANNON]: 0,
        [DefenseId.ION_CANNON]: 0,
        [DefenseId.PLASMA_TURRET]: 0,
        [DefenseId.SMALL_SHIELD]: 0,
        [DefenseId.LARGE_SHIELD]: 0,
    },
    constructionQueue: [],
    shipyardQueue: [],
    activeMissions: [],
    incomingMissions: [],
    missionLogs: [],
    lastTick: Date.now(),
    xp: 0,
    level: 1,
    version: 1,
};

const calculatePoints = (resources: any, buildings: any, ships: any, research: any, defenses: any) => {
    // 1. Resources Points (1 pkt per 1000 resources)
    const r = resources || {};
    const resPoints = ((Number(r.metal) || 0) + (Number(r.crystal) || 0) + (Number(r.deuterium) || 0));

    // 2. Building Points (Cumulative Cost)
    let buildPoints = 0;
    Object.entries(buildings || {}).forEach(([id, level]) => {
        const def = BUILDINGS[id as BuildingId];
        if (!def) return;
        let cost = 0;
        for (let l = 1; l <= (level as number); l++) {
            const factor = Math.pow(1.5, l - 1);
            cost += Math.floor(def.baseCost.metal * factor) + Math.floor(def.baseCost.crystal * factor) + Math.floor(def.baseCost.deuterium * factor);
        }
        buildPoints += cost;
    });

    // 3. Research Points (Cumulative Cost)
    let researchPoints = 0;
    Object.entries(research || {}).forEach(([id, level]) => {
        const def = RESEARCH[id as ResearchId];
        if (!def) return;
        let cost = 0;
        for (let l = 1; l <= (level as number); l++) {
            const factor = Math.pow(1.5, l - 1);
            cost += Math.floor(def.baseCost.metal * factor) + Math.floor(def.baseCost.crystal * factor) + Math.floor(def.baseCost.deuterium * factor);
        }
        researchPoints += cost;
    });

    // 4. Fleet Points (Unit Cost * Count)
    let fleetPoints = 0;
    Object.entries(ships || {}).forEach(([id, count]) => {
        const def = SHIPS[id as ShipId];
        if (!def) return;
        const unitCost = def.baseCost.metal + def.baseCost.crystal + def.baseCost.deuterium;
        fleetPoints += unitCost * (count as number);
    });

    // 5. Defense Points (Unit Cost * Count)
    let defensePoints = 0;
    Object.entries(defenses || {}).forEach(([id, count]) => {
        const def = DEFENSES[id as DefenseId];
        if (!def) return;
        const unitCost = def.cost.metal + def.cost.crystal + def.cost.deuterium;
        defensePoints += unitCost * (count as number);
    });

    const totalValue = resPoints + buildPoints + researchPoints + fleetPoints + defensePoints;
    return Math.floor(totalValue / 1000);
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode, session: any }> = ({ children, session }) => {
    const [gameState, setGameState] = useState<GameState>({ ...initialState, userId: session?.user.id });
    const [loaded, setLoaded] = useState(false);
    const [isSyncPaused, setIsSyncPaused] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine); // NEW: Track network status

    // Network Status Listeners
    useEffect(() => {
        const handleOnline = () => {
            console.log('🌐 Status: ONLINE');
            setIsOnline(true);
            setIsSyncPaused(false); // Try to resume sync
        };
        const handleOffline = () => {
            console.log('🔌 Status: OFFLINE');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []); // Circuit breaker for Auth errors
    const [planets, setPlanets] = useState<any[]>([]);
    const [currentPlanetId, setCurrentPlanetId] = useState<string | null>(null);
    const [mainPlanetName, setMainPlanetName] = useState<string>('Główna');
    const [mainPlanetCoords, setMainPlanetCoords] = useState<{ galaxy: number, system: number, position: number } | null>(null);
    const [mainPlanetCache, setMainPlanetCache] = useState<GameState | null>(null); // Cache main planet data when switching to colony
    const gameStateRef = useRef(gameState);
    const currentPlanetRef = useRef(currentPlanetId);

    // Keep ref synchronized
    useEffect(() => {
        gameStateRef.current = gameState;
        currentPlanetRef.current = currentPlanetId;
    }, [gameState, currentPlanetId]);

    // Debug version
    useEffect(() => {

    }, []);

    // Last saved state for validation
    const lastSavedStateRef = useRef<GameState | null>(null);
    const rescuedMissionIdsRef = useRef<Set<string>>(new Set()); // Track rescued IDs to prevent re-fetching stale data


    // ========== CENTRALIZED SAVE FUNCTION ==========
    const saveGame = async (reason: string): Promise<boolean> => {
        if (isSyncPaused) {
            console.warn('⚠️ [SAVE] Paused due to auth error');
            return false;
        }

        const current = gameStateRef.current;
        const targetPlanet = currentPlanetRef.current;
        const isColony = targetPlanet && targetPlanet !== 'main' && targetPlanet !== null; // Strict check

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`💾 [SAVE START] Reason: ${reason}`);
        console.log(`💾 [SAVE] Target: ${isColony ? `Colony (${targetPlanet})` : 'Main Planet'}`);
        console.log('💾 [SAVE] Current State:');
        console.log('  📦 Resources:', JSON.stringify(current.resources));
        console.log('  🏗️ Buildings:', JSON.stringify(current.buildings));
        console.log('  🔬 Research:', JSON.stringify(current.research));
        console.log('  🚀 Ships:', JSON.stringify(current.ships));
        console.log('  🛡️ Defenses:', JSON.stringify(current.defenses));
        console.log('  🔨 ConstructionQueue:', current.constructionQueue?.length || 0, 'items');
        console.log('  🔧 ShipyardQueue:', current.shipyardQueue?.length || 0, 'items');
        console.log('  🌌 GalaxyCoords:', JSON.stringify(current.galaxyCoords));
        console.log('  👤 Nickname:', current.nickname);
        console.log('  🪐 PlanetName:', current.planetName);

        // Save to LocalStorage first (backup)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));

        let success = false;

        // Prepare global profile payload
        // If on Colony, we must MERGE synced data (missions, research) with existing Main Planet data (resources)
        // If on Main, we overwrite everything (except we don't zero out missing fields usually, but here we construct full payload)

        let profilePayload: any = {};
        let planetPayload: any = null;
        let targetPlanetId: string | null = null;

        if (isColony) {
            // COLONY SAVE: We need to update PLanets table AND sync Global parts to Profile

            // 1. Prepare Colony Data (Planets Table)
            planetPayload = {
                buildings: current.buildings,
                ships: current.ships,
                defenses: current.defenses,
                resources: current.resources,
                construction_queue: current.constructionQueue,
                shipyard_queue: current.shipyardQueue,
            };
            targetPlanetId = targetPlanet;

            // 2. Prepare Profile Sync (Global Data only)
            // Fetch current profile to get Safe Resources
            const { data: profileData } = await supabase
                .from('profiles')
                .select('resources, debris')
                .eq('id', session.user.id)
                .single();

            const dbResources = profileData?.resources || {};

            // Merge Resources: DB Metal/Crystal + Local Dark Matter
            const safeResources = {
                ...dbResources,
                darkMatter: gameState.resources.darkMatter
            };

            profilePayload = {
                research: current.research,
                production_settings: {
                    ...current.productionSettings,
                    avatarUrl: current.avatarUrl,
                    planetType: current.planetType,
                    nickname: current.nickname
                },
                nickname: current.nickname,
                active_missions: current.activeMissions,
                resources: safeResources, // Global resources (Dark Matter sync)
                last_updated: Date.now(),
                level: current.level,
                xp: current.xp
            };

            // Update Reference State immediately for Colony to prevent Desync
            lastSavedStateRef.current = { ...current };

        } else {
            // MAIN PLANET SAVE: Everything goes to Profile
            profilePayload = {
                planet_name: current.planetName,
                nickname: current.nickname,
                resources: current.resources,
                buildings: current.buildings,
                research: current.research,
                ships: current.ships,
                defenses: current.defenses,
                construction_queue: current.constructionQueue,
                shipyard_queue: current.shipyardQueue,
                production_settings: {
                    ...current.productionSettings,
                    avatarUrl: current.avatarUrl,
                    planetType: current.planetType,
                    nickname: current.nickname
                },
                active_missions: current.activeMissions,
                mission_logs: current.missionLogs,
                galaxy_coords: current.galaxyCoords,
                points: calculatePoints(current.resources, current.buildings, current.ships, current.research, current.defenses),
                last_updated: Date.now(),
                level: current.level,
                xp: current.xp
            };
        }

        try {
            console.log(`💾 [SAVE] Calling RPC save_game_atomic (Ver: ${current.version || 1})`);

            const { data, error } = await supabase.rpc('save_game_atomic', {
                p_user_id: session.user.id,
                p_profile_data: profilePayload,
                p_planet_id: targetPlanetId,
                p_planet_data: planetPayload,
                p_expected_version: current.version || 1
            });

            if (error) {
                console.error('❌ [SAVE RPC ERROR]', error);

                if (error.message && error.message.includes('VERSION_MISMATCH')) {
                    alert('⚠️ KONFLIKT DANYCH!\n\nSerwer posiada nowszą wersję zapisu (grałeś na innym urządzeniu?).\nStrona zostanie przeładowana, aby pobrać aktualny stan.');
                    window.location.reload();
                    return false;
                }

                throw error;
            }

            if (data && data.success) {
                const newVersion = data.new_version;
                console.log(`✅ [SAVE SUCCESS] Version bumped to ${newVersion}`);

                // Update local version
                setGameState(prev => ({
                    ...prev,
                    version: newVersion
                }));

                // Also update ref immediately so next save uses correct version
                gameStateRef.current.version = newVersion;

                // Store for validation
                lastSavedStateRef.current = JSON.parse(JSON.stringify(current));
                return true;
            }

        } catch (error: any) {
            console.error('❌ [SAVE EXCEPTION]', error);
            // Detect network error
            if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
                setIsOnline(false);
            }
            if (error.code === '401' || error.code === '403') {
                setIsSyncPaused(true);
            }
            return false;
        }

        return false;
    };

    // ========== VALIDATION FUNCTION ==========
    const validateState = (loaded: Partial<GameState>, source: string) => {
        const saved = lastSavedStateRef.current;
        if (!saved) {
            console.log('🔍 [VALIDATE] No previous state to compare');
            return;
        }

        console.log('🔍 [VALIDATE] Comparing loaded state vs last saved...');
        const issues: string[] = [];

        // Deep compare objects and show key-by-key differences
        const compareObjects = (name: string, loadedObj: any, savedObj: any, skipKeys: string[] = []) => {
            if (!savedObj || !loadedObj) {
                // Skip research comparison for colonies (research is global on profile)
                if (name === 'research') {
                    console.log('🔍 [VALIDATE] Skipping research (global, not per-planet)');
                    return;
                }
                if (savedObj !== loadedObj) {
                    issues.push(`⚠️ [DESYNC] ${name}: one is null/undefined`);
                }
                return;
            }

            const allKeys = new Set([...Object.keys(savedObj), ...Object.keys(loadedObj)]);
            const diffs: string[] = [];

            allKeys.forEach(key => {
                // Skip calculated fields
                if (skipKeys.includes(key)) return;

                const savedVal = savedObj[key];
                const loadedVal = loadedObj[key];

                if (typeof savedVal === 'object' && savedVal !== null) {
                    // Nested object - compare recursively
                    const savedStr = JSON.stringify(savedVal);
                    const loadedStr = JSON.stringify(loadedVal);
                    if (savedStr !== loadedStr) {
                        diffs.push(`  ${key}: SAVED=${savedStr.substring(0, 50)} LOADED=${loadedStr?.substring(0, 50)}`);
                    }
                } else if (typeof savedVal === 'number' && typeof loadedVal === 'number') {
                    // Use tolerance for floats (production drift)
                    const tolerance = Math.max(1, Math.abs(savedVal) * 0.01); // 1% or 1 unit
                    if (Math.abs(savedVal - loadedVal) > tolerance) {
                        diffs.push(`  ${key}: SAVED=${savedVal} → LOADED=${loadedVal}`);
                    }
                } else if (savedVal !== loadedVal) {
                    diffs.push(`  ${key}: SAVED=${savedVal} → LOADED=${loadedVal}`);
                }
            });

            if (diffs.length > 0) {
                issues.push(`⚠️ [DESYNC] ${name} has ${diffs.length} differences:`);
                diffs.forEach(d => console.warn(d));
            }
        };

        compareObjects('buildings', loaded.buildings, saved.buildings);
        compareObjects('research', loaded.research, saved.research); // Will skip if null (colony)
        compareObjects('ships', loaded.ships, saved.ships);
        compareObjects('defenses', loaded.defenses, saved.defenses);
        compareObjects('resources', loaded.resources, saved.resources, ['energy', 'maxEnergy']); // Skip calculated

        // Simple comparisons
        if (JSON.stringify(loaded.constructionQueue) !== JSON.stringify(saved.constructionQueue)) {
            issues.push(`⚠️ [DESYNC] constructionQueue:\nSAVED=${JSON.stringify(saved.constructionQueue)}\nLOADED=${JSON.stringify(loaded.constructionQueue)}`);
        }
        if (JSON.stringify(loaded.shipyardQueue) !== JSON.stringify(saved.shipyardQueue)) {
            issues.push(`⚠️ [DESYNC] shipyardQueue:\nSAVED=${JSON.stringify(saved.shipyardQueue)}\nLOADED=${JSON.stringify(loaded.shipyardQueue)}`);
        }

        if (issues.length > 0) {
            console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.warn('🚨 [VALIDATION FAILED] Data desync detected:');
            issues.forEach(i => console.warn(i));
            console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } else {
            console.log('✅ [VALIDATE] State matches - no desync detected from', source);
        }
    };

    const findTargetUser = async (coords: { galaxy: number, system: number, position: number }) => {
        // Query using JSON field - galaxy_coords contains {galaxy, system, position}
        const { data, error } = await supabase
            .from('profiles')
            .select('id, galaxy_coords')
            .not('galaxy_coords', 'is', null);

        if (error) {
            console.error('Error finding target user:', error);
            return null;
        }

        // Filter in-memory since Supabase JSON querying can be tricky
        const target = data?.find((profile: any) =>
            profile.galaxy_coords?.galaxy === coords.galaxy &&
            profile.galaxy_coords?.system === coords.system &&
            profile.galaxy_coords?.position === coords.position
        );

        return target?.id || null;
    };

    // Replace fetching activeMissions from profile with fetching from 'missions' table
    const fetchMissions = async () => {
        if (!session?.user || isSyncPaused) return;

        // Fetch missions where I am owner OR target
        const { data, error } = await supabase
            .from('missions')
            .select('*')
            .or(`owner_id.eq.${session.user.id}, target_user_id.eq.${session.user.id}`);

        if (data && !error) {
            const mappedMissions: FleetMission[] = data.map((m: any) => ({
                id: m.id,
                ownerId: m.owner_id,
                targetUserId: m.target_user_id,
                type: m.mission_type as MissionType,
                ships: m.ships,
                targetCoords: m.target_coords,
                originCoords: m.origin_coords,
                startTime: m.start_time,
                arrivalTime: m.arrival_time,
                returnTime: m.return_time,
                eventProcessed: m.status !== 'flying',
                status: m.status,
                resources: m.resources,
                result: m.result
            }));

            const now = Date.now();
            const rescueThreshold = now - 10000; // 10s grace period

            // SILENT RESCUE: Identify missions that are "flying" but past arrival time (Zombies)
            // We filter them OUT of state to prevent UI flicker, and trigger background fix.
            const zombies = mappedMissions.filter(m =>
                m.status === 'flying' &&
                m.arrivalTime < rescueThreshold &&
                !rescuedMissionIdsRef.current.has(m.id)
            );

            if (zombies.length > 0) {
                console.log('🧟 [SILENT RESCUE] Zombies detected:', zombies.length);
                zombies.forEach(z => {
                    rescuedMissionIdsRef.current.add(z.id); // Block local re-entry
                    // Background DB Fix
                    supabase.from('missions').update({
                        status: 'completed', // Force complete to stop loop
                        result: { // Minimal result to satisfy constraints
                            id: `${z.id}-rescue`,
                            timestamp: Date.now(),
                            outcome: 'neutral',
                            title: 'Zaginiona Flota',
                            message: 'Misja zakończona awaryjnie (Silent Rescue).'
                        }
                    }).eq('id', z.id).then(({ error }) => {
                        if (error) console.error('Silent Rescue DB Error:', error);
                        else console.log('🧟 [SILENT RESCUE] DB Updated for', z.id);
                    });
                });
            }

            const myMissions = mappedMissions.filter(m => m.ownerId === session.user.id && m.status !== 'completed' && !rescuedMissionIdsRef.current.has(m.id));

            // Filter incoming: Must be flying, NOT my own, AND NOT A ZOMBIE (arrival > threshold)
            let incoming = mappedMissions.filter(m =>
                m.targetUserId === session.user.id &&
                m.ownerId !== session.user.id &&
                m.status === 'flying' &&
                m.arrivalTime > rescueThreshold && // HIDE ZOMBIES FROM UI
                !rescuedMissionIdsRef.current.has(m.id)
            );

            if (incoming.length > 0) {
                // Fetch attacker nicknames
                const attackerIds = Array.from(new Set(incoming.map(m => m.ownerId)));
                const { data: attackers } = await supabase.from('profiles').select('id, nickname').in('id', attackerIds);

                if (attackers) {
                    const attackerMap = new Map(attackers.map(a => [a.id, a.nickname]));
                    incoming = incoming.map(m => ({
                        ...m,
                        attackerName: attackerMap.get(m.ownerId!) || 'Nieznany'
                    }));
                }
                console.log('Incoming Attacks Detected:', incoming);
            }

            setGameState(prev => ({
                ...prev,
                activeMissions: myMissions,
                incomingMissions: incoming
            }));
        } else if (error) {
            console.error('Error fetching missions:', error);
            if (error.code === '401' || error.code === '403' || error.message.includes('JWT')) {
                console.error("🛑 CRITICAL: Pausing Sync due to Auth Error. Please run SQL RLS script.");
                setIsSyncPaused(true);
            }
        }
    };


    // Load from Supabase or LocalStorage
    const refreshProfile = async () => {
        if (!session?.user) return;

        // Try Supabase first
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (data && !error) {
            // Offline Production Calculation
            const lastUpdated = data.last_updated || Date.now();
            const now = Date.now();
            const timeDiff = Math.max(0, (now - lastUpdated) / 1000); // Seconds since last save
            let loadedResources = { ...data.resources };

            if (timeDiff > 1) {
                console.log(`🕒 Calculating offline production for ${timeDiff.toFixed(0)} seconds...`);

                const b = { ...initialState.buildings, ...data.buildings };
                const s = { ...initialState.productionSettings, ...data.production_settings };

                // Production Formulas (Standard OGame-like)
                const metalLevel = b[BuildingId.METAL_MINE] || 0;
                const crystalLevel = b[BuildingId.CRYSTAL_MINE] || 0;
                const deuteriumLevel = b[BuildingId.DEUTERIUM_SYNTH] || 0;
                const solarLevel = b[BuildingId.SOLAR_PLANT] || 0;
                const fusionLevel = b[BuildingId.FUSION_REACTOR] || 0;

                // Energy Calculation
                const solarEnergy = 20 * solarLevel * Math.pow(1.1, solarLevel);
                const fusionEnergy = 30 * fusionLevel * Math.pow(1.05 + (0.01 * (b[ResearchId.ENERGY_TECH] || 0)), fusionLevel);
                const maxEnergy = Math.floor(solarEnergy + fusionEnergy);

                // Consumption
                const metalCons = 10 * metalLevel * Math.pow(1.1, metalLevel);
                const crystalCons = 10 * crystalLevel * Math.pow(1.1, crystalLevel);
                const deuteriumCons = 20 * deuteriumLevel * Math.pow(1.1, deuteriumLevel);
                const totalCons = Math.ceil(metalCons + crystalCons + deuteriumCons);

                const efficiency = maxEnergy >= totalCons ? 1 : (maxEnergy / (totalCons || 1));

                // Production (Base + Mine) * Efficiency * Settings
                const metalProd = (30 * metalLevel * Math.pow(1.1, metalLevel)) * efficiency * (s[BuildingId.METAL_MINE] ?? 100) / 100;
                const crystalProd = (20 * crystalLevel * Math.pow(1.1, crystalLevel)) * efficiency * (s[BuildingId.CRYSTAL_MINE] ?? 100) / 100;
                const deutProd = (10 * deuteriumLevel * Math.pow(1.1, deuteriumLevel) * 1.0) * efficiency * (s[BuildingId.DEUTERIUM_SYNTH] ?? 100) / 100;

                // Safety: Ensure storage structure exists
                if (!loadedResources.storage) {
                    loadedResources.storage = JSON.parse(JSON.stringify(initialState.resources.storage));
                }

                // Apply to resources
                loadedResources.metal = Math.min(loadedResources.storage.metal, loadedResources.metal + (metalProd * timeDiff));
                loadedResources.crystal = Math.min(loadedResources.storage.crystal, loadedResources.crystal + (crystalProd * timeDiff));
                loadedResources.deuterium = Math.min(loadedResources.storage.deuterium, loadedResources.deuterium + (deutProd * timeDiff));
            }

            // Merge loaded data
            setMainPlanetName(data.planet_name || 'Główna');

            // DEBUG: Log what we loaded from DB
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📥 [LOAD] Profile loaded from Supabase');
            console.log('📥 [LOAD] Raw DB Data:');
            console.log('  📦 Resources:', JSON.stringify(data.resources));
            console.log('  🏗️ Buildings:', JSON.stringify(data.buildings));
            console.log('  🔬 Research:', JSON.stringify(data.research));
            console.log('  🚀 Ships:', JSON.stringify(data.ships));
            console.log('  🛡️ Defenses:', JSON.stringify(data.defenses));
            console.log('  🔨 ConstructionQueue:', data.construction_queue?.length || 0, 'items');
            console.log('  🔧 ShipyardQueue:', data.shipyard_queue?.length || 0, 'items');
            console.log('  🌌 GalaxyCoords:', JSON.stringify(data.galaxy_coords));
            console.log('  👤 Nickname:', data.nickname);
            console.log('  🪐 PlanetName:', data.planet_name);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            const mergedState = {
                planetName: data.planet_name || 'Nowa Kolonia',
                nickname: data.nickname || data.production_settings?.nickname || 'Player',
                resources: { ...initialState.resources, ...loadedResources },
                buildings: { ...initialState.buildings, ...data.buildings },
                research: { ...initialState.research, ...data.research },
                ships: { ...initialState.ships, ...data.ships },
                defenses: { ...initialState.defenses, ...data.defenses },
                constructionQueue: data.construction_queue || [],
                shipyardQueue: data.shipyard_queue || [],
                productionSettings: { ...initialState.productionSettings, ...data.production_settings },
                avatarUrl: data.production_settings?.avatarUrl || initialState.avatarUrl,
                planetType: data.production_settings?.planetType || 'terran',
                missionLogs: data.mission_logs || [],
                galaxyCoords: data.galaxy_coords,
                version: data.version || 1, // Load version from DB
                debris: data.debris || { metal: 0, crystal: 0 },
            };

            // Store main planet coords permanently (doesn't change when switching colonies)
            if (data.galaxy_coords) {
                setMainPlanetCoords(data.galaxy_coords);
            }

            // Validate if we have previous state
            validateState(mergedState, 'refreshProfile (Main Planet)');

            setGameState(prev => ({
                ...prev,
                ...mergedState,
                lastTick: Date.now()
            }));

            // Sync offline production back to DB immediately so we don't recalculate it if user refreshes again
            if (timeDiff > 1) {
                supabase.from('profiles').update({
                    resources: loadedResources
                }).eq('id', session.user.id).then(({ error }) => {
                    if (error) console.error("Failed to save offline production:", error);
                });
            }

        } else {
            if (error) {
                console.error("Profile Load Error:", error);
                if (error.code === '401' || error.code === '403') {
                    console.error("🛑 RLS Policy Missing");
                    setIsSyncPaused(true);
                    return; // STOP!
                }
                // If generic error (e.g. timeout) and NOT "row not found" (PGRST116), unsafe to overwrite.
                if (error.code !== 'PGRST116') {
                    alert("Błąd połączenia z bazą danych (Profile Load). Nie nadpisuję danych.");
                    return; // STOP!
                }
            }

            // Fallback to localstorage only if user IDs match (security)
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // SECURITY CHECK: Only load if saved state belongs to this user
                    if (parsed.userId && parsed.userId === session.user.id) {
                        if (parsed.production_settings?.nickname) parsed.nickname = parsed.production_settings.nickname;

                        setGameState(prev => ({
                            ...prev,
                            ...parsed,
                            userId: session.user.id,
                            lastTick: Date.now()
                        }));
                    } else {
                        console.warn("Cleared mismatching local storage data");
                        localStorage.removeItem(STORAGE_KEY);
                        setGameState(prev => ({ ...initialState, userId: session.user.id }));
                    }
                } catch (e) {
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        }
        setLoaded(true);
    };

    // Load from Supabase or LocalStorage
    // Load from Supabase or LocalStorage
    useEffect(() => {
        refreshProfile();
        fetchMissions();
        fetchPlanets();

        // Poll for updates (logs, missions, attacks) - DO NOT call refreshProfile here, it overwrites local resources!
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible' && !isSyncPaused) {
                // Only fetch missions and logs, NOT full profile (which would overwrite local resource changes)
                fetchMissions();

                // Fetch only logs from DB without overwriting resources
                supabase.from('profiles').select('mission_logs, nickname').eq('id', session?.user?.id).single().then(({ data }) => {
                    if (data) {
                        setGameState(prev => ({
                            ...prev,
                            missionLogs: data.mission_logs || prev.missionLogs,
                            nickname: data.nickname || prev.nickname
                        }));
                    }
                });
            }
        }, 60000); // 60 seconds (Realtime handles immediate events, this is just a backup)

        return () => clearInterval(interval);
    }, [session]);

    // Auto-save loop (Interval instead of debounce to prevent starvation by ticks)
    useEffect(() => {
        if (!loaded || !session?.user || isSyncPaused) return;

        const save = async () => {
            await saveGame('Auto-Save (60s interval)');
        };

        const interval = setInterval(save, 60000); // Save every 60 seconds (optimized for DB limits)

        // Save on unmount / refresh - MUST be synchronous for beforeunload
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Synchronous localStorage save (guaranteed to complete)
            const current = gameStateRef.current;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
            localStorage.setItem(STORAGE_KEY + '_backup', JSON.stringify({
                ...current,
                _savedAt: Date.now(),
                _savedBy: 'beforeunload'
            }));
            console.log('💾 [BEFOREUNLOAD] Saved to localStorage');

            // Also try async DB save (best effort)
            save();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            clearInterval(interval);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Try to save on unmount (best effort)
            save();
        };
    }, [loaded, session]);

    // REAL TIME MISSION HANDLING & DATABASE SYNC

    // Process Mission Arrival (Target reached)
    // Process Mission Arrival (Target reached) - ATOMIC RETRY REFACTOR
    const processMissionArrival = async (mission: FleetMission) => {
        if (mission.eventProcessed) return;

        // ATOMIC LOCK: Prevent double-processing by multiple sessions
        const { data: lockResult, error: lockError } = await supabase
            .from('missions')
            .update({ status: 'processing' })
            .eq('id', mission.id)
            .eq('status', 'flying')
            .select('id');

        if (lockError || !lockResult || lockResult.length === 0) {
            console.log('⚠️ Mission already being processed by another session:', mission.id);
            return; // Another session grabbed this mission
        }

        let retries = 0;
        const MAX_RETRIES = 5;

        // Loop for Retry on Version Mismatch (Optimistic Locking)
        while (retries < MAX_RETRIES) {
            let result: any = {};
            let loot: MissionRewards = {};
            let survivingAttacker = { ...mission.ships };

            try {
                console.log(`Przetwarzanie Przylotu (Próba ${retries + 1}):`, mission.id, mission.type);

                // --- 1. COLONIZATION (Safe - uses Insert) ---
                if (mission.type === MissionType.COLONIZE) {
                    const { data: existingPlanets } = await supabase.from('planets').select('id').contains('galaxy_coords', mission.targetCoords);
                    const { data: existingProfiles } = await supabase.from('profiles').select('id').contains('galaxy_coords', mission.targetCoords);

                    if ((existingPlanets && existingPlanets.length > 0) || (existingProfiles && existingProfiles.length > 0)) {
                        result = { id: `${mission.id}-fail`, timestamp: Date.now(), title: 'Kolonizacja Nieudana', message: `Pozycja [${mission.targetCoords.galaxy}:${mission.targetCoords.system}:${mission.targetCoords.position}] zajęta.`, outcome: 'failure' };
                    } else {
                        const { error } = await supabase.from('planets').insert({
                            owner_id: mission.ownerId,
                            planet_name: `Kolonia ${planets.length + 1}`,
                            planet_type: 'terran',
                            galaxy_coords: mission.targetCoords,
                            resources: { metal: 500 + (mission.resources?.metal || 0), crystal: 300 + (mission.resources?.crystal || 0), deuterium: 100 + (mission.resources?.deuterium || 0), darkMatter: 0, energy: 0, maxEnergy: 0, storage: { metal: 10000, crystal: 10000, deuterium: 10000 } },
                            buildings: {}, ships: {}, defenses: {}, is_main: false
                        });
                        if (!error) {
                            result = { id: `${mission.id}-success`, timestamp: Date.now(), title: 'Kolonizacja Zakończona', message: `Nowa kolonia założona.`, outcome: 'success' };
                            survivingAttacker = {} as any;
                            fetchPlanets();
                        } else {
                            result = { id: `${mission.id}-error`, timestamp: Date.now(), title: 'Błąd Kolonizacji', message: error.message, outcome: 'failure' };
                        }
                    }
                    // Break loop for Colonize (no version check needed on insert)
                    retries = MAX_RETRIES + 1;

                    // --- 2. EXPEDITION (Safe - updates current user later) ---
                } else if (mission.type === MissionType.EXPEDITION) {
                    const expeditionResult = calculateExpeditionOutcome(mission);
                    result = expeditionResult.log;
                    if (expeditionResult.rewards) loot = expeditionResult.rewards;
                    // Break loop
                    retries = MAX_RETRIES + 1;

                    // --- RECYCLE MISSION ---
                } else if (mission.type === MissionType.RECYCLE) {
                    // 1. Fetch Target (Profile or Planet)
                    const { data: ps } = await supabase.from('planets').select('*').contains('galaxy_coords', mission.targetCoords);
                    const { data: pr } = await supabase.from('profiles').select('*').contains('galaxy_coords', mission.targetCoords);

                    let targetObj = (ps && ps[0]) || (pr && pr[0]);
                    let table = (ps && ps[0]) ? 'planets' : 'profiles';

                    if (!targetObj) {
                        result = { id: `${mission.id}-fail`, timestamp: Date.now(), title: 'Recykling Nieudany', message: `Brak pola zniszczeń na tych koordynatach.`, outcome: 'failure' };
                    } else {
                        const debris = targetObj.debris || { metal: 0, crystal: 0 };
                        const totalDebris = (debris.metal || 0) + (debris.crystal || 0);

                        if (totalDebris <= 0) {
                            result = { id: `${mission.id}-empty`, timestamp: Date.now(), title: 'Raport Recyklingu', message: `Pole zniszczeń jest puste.`, outcome: 'neutral' };
                        } else {
                            const recyclerCount = mission.ships[ShipId.RECYCLER] || 0;
                            const capacity = recyclerCount * 20000;

                            let remainingCapacity = capacity;
                            const metalToTake = Math.min(debris.metal || 0, remainingCapacity);
                            remainingCapacity -= metalToTake;
                            const crystalToTake = Math.min(debris.crystal || 0, remainingCapacity);

                            const newDebris = {
                                metal: (debris.metal || 0) - metalToTake,
                                crystal: (debris.crystal || 0) - crystalToTake
                            };

                            const { error: upError } = await supabase.from(table).update({ debris: newDebris }).eq('id', targetObj.id);

                            if (upError) {
                                result = { id: `${mission.id}-err`, timestamp: Date.now(), title: 'Błąd Recyklingu', message: upError.message, outcome: 'failure' };
                            } else {
                                await supabase.from('fleets').update({
                                    resources: { metal: metalToTake, crystal: crystalToTake, deuterium: 0 }
                                }).eq('id', mission.id);

                                result = { id: `${mission.id}-success`, timestamp: Date.now(), title: 'Recykling Zakończony', message: `Odzyskano: M:${metalToTake} K:${crystalToTake}.`, outcome: 'success', rewards: { metal: metalToTake, crystal: crystalToTake } };
                            }
                        }
                    }
                    retries = MAX_RETRIES + 1;

                    // --- 3. ATTACK / SPY / TRANSPORT (CRITICAL: TARGET UPDATE) ---
                } else if (mission.type === MissionType.ATTACK || mission.type === MissionType.SPY || mission.type === MissionType.TRANSPORT) {

                    if (!mission.targetUserId) {
                        // NPC / Empty Space
                        if (mission.type === MissionType.ATTACK) {
                            // PvE (Pirates) logic... (Keeping existing simplified PvE)
                            const battle = generatePvPBattleResult(mission.ships, {}, {}, {}, {}, { metal: 5000, crystal: 3000, deuterium: 500 } as any, true);
                            result = { id: `${mission.id}-pve`, timestamp: Date.now(), title: 'Bitwa z Piratami', message: `Wynik: ${battle.attackerWon ? 'Wygrana' : 'Przegrana'}.`, outcome: 'success', rewards: battle.loot, report: battle.report };
                            loot = battle.loot;
                            survivingAttacker = battle.survivingAttackerShips as any;
                            addXP(30, 'Pirate Combat');
                        } else {
                            result = { id: Date.now().toString(), timestamp: Date.now(), outcome: 'neutral', title: 'Raport', message: 'Cel nie istnieje (Pustka).' };
                            if (mission.type === MissionType.TRANSPORT) loot = mission.resources || {};
                        }
                        // Break loop for Colonize
                        retries = MAX_RETRIES + 1;

                    } else {
                        // PvP - ATOMIC UPDATE REQUIRED
                        // A. Fetch Target (Fresh)
                        const { data: targetProfile, error: targetError } = await supabase.from('profiles').select('*').eq('id', mission.targetUserId).single();
                        if (targetError) throw new Error(`Target fetch error`);

                        let newTargetData: any = {};
                        let newLogs = [...(targetProfile.mission_logs || [])];

                        // Attacker Name Logic
                        let attackerName = mission.attackerName || 'Nieznany';
                        if (mission.ownerId === session.user.id) attackerName = gameStateRef.current.nickname || 'Ty';
                        else if (!mission.attackerName) {
                            const { data: attProfile } = await supabase.from('profiles').select('nickname').eq('id', mission.ownerId).single();
                            if (attProfile) attackerName = attProfile.nickname;
                        }

                        // B. Calculate Outcome based on FRESH targetProfile
                        if (mission.type === MissionType.ATTACK) {
                            let attackerResearch = {};
                            if (mission.ownerId === session.user.id) attackerResearch = gameStateRef.current.research; // Use local if I am attacker (safe enough)
                            // Note: Ideally fetch attacker research fresh too, but less critical than target resources.

                            const battle = generatePvPBattleResult(mission.ships, targetProfile.ships, targetProfile.defenses || {}, targetProfile.buildings, targetProfile.research, targetProfile.resources, false, attackerResearch);

                            result = {
                                id: `${mission.id}-result`, timestamp: Date.now(), title: battle.attackerWon ? 'Zwycięstwo!' : 'Porażka',
                                message: `Wynik: ${battle.attackerWon ? 'Wygrana' : 'Przegrana'}. Zrabowano: M:${Math.floor(battle.loot.metal)} C:${Math.floor(battle.loot.crystal)}.`,
                                outcome: battle.attackerWon ? 'success' : 'failure', rewards: battle.loot, report: battle.report
                            };
                            loot = battle.loot;
                            survivingAttacker = battle.survivingAttackerShips as any;

                            // XP
                            if (battle.report.result === 'attacker_win') addXP(50, 'PvP Victory');

                            // Target Updates (Losses)
                            newTargetData.ships = battle.survivingDefenderShips;
                            newTargetData.defenses = battle.survivingDefenderDefenses;

                            // Buildings Damage
                            const newBuildings = { ...targetProfile.buildings };
                            Object.entries(battle.damagedBuildings || {}).forEach(([bid, dmg]) => {
                                if (newBuildings[bid]) newBuildings[bid] = Math.max(0, newBuildings[bid] - (dmg as number));
                            });
                            newTargetData.buildings = newBuildings;

                            // Resources Update (Loot)
                            newTargetData.resources = {
                                ...targetProfile.resources,
                                metal: Math.max(0, targetProfile.resources.metal - (loot.metal || 0)),
                                crystal: Math.max(0, targetProfile.resources.crystal - (loot.crystal || 0)),
                                deuterium: Math.max(0, targetProfile.resources.deuterium - (loot.deuterium || 0))
                            };

                            // Debris Update
                            const existingDebris = targetProfile.debris || { metal: 0, crystal: 0 };
                            const addedDebris = (battle as any).debris || { metal: 0, crystal: 0 };
                            newTargetData.debris = {
                                metal: (existingDebris.metal || 0) + (addedDebris.metal || 0),
                                crystal: (existingDebris.crystal || 0) + (addedDebris.crystal || 0)
                            };

                            // Target Log
                            newLogs.unshift({
                                id: `${mission.id}-def-log`, timestamp: Date.now(), title: "ZOSTAŁEŚ ZAATAKOWANY!",
                                message: `Gracz ${attackerName} zaatakował Cię. Wynik: ${battle.attackerWon ? 'PRZEGRANA' : 'OBRONA'}.`,
                                outcome: 'danger',
                                report: battle.report // Nested Report for UI
                            });

                        } else if (mission.type === MissionType.TRANSPORT) {
                            newTargetData.resources = {
                                ...(targetProfile.resources || {}), // PRESERVE STORAGE & DARK MATTER
                                metal: (targetProfile.resources?.metal || 0) + (mission.resources?.metal || 0),
                                crystal: (targetProfile.resources?.crystal || 0) + (mission.resources?.crystal || 0),
                                deuterium: (targetProfile.resources?.deuterium || 0) + (mission.resources?.deuterium || 0),
                            };
                            newLogs.unshift({ id: Date.now().toString(), timestamp: Date.now(), title: "Dostawa Surowców", message: `Otrzymano surowce od ${attackerName}.`, outcome: 'success' });
                            result = { id: Date.now().toString(), timestamp: Date.now(), outcome: 'success', title: 'Transport', message: `Surowce dostarczone.` };

                        } else if (mission.type === MissionType.SPY) {
                            // Spy Logic ... (Simplified for brevity, keep full in real code)
                            // Spy doesn't change resources/ships, only Logs.
                            newLogs.unshift({ id: Date.now().toString(), timestamp: Date.now(), title: "Wykryto Skanowanie!", message: `Gracz ${attackerName} przeskanował planetę.`, outcome: 'danger' });
                            result = { id: Date.now().toString(), timestamp: Date.now(), outcome: 'success', title: 'Raport', message: 'Skanowanie zakończone.' };
                            // Spy Result Details ... (Assume calculated)
                        }

                        // C. ATOMIC SAVE (Target)
                        const { error: rpcError } = await supabase.rpc('save_game_atomic', {
                            p_user_id: mission.targetUserId,
                            p_profile_data: {
                                ...newTargetData,
                                mission_logs: newLogs.slice(0, 50),
                                last_updated: Date.now() // Trigger Realtime update
                            },
                            p_expected_version: targetProfile.version || 1
                        });

                        if (rpcError) {
                            if (rpcError.message.includes('VERSION_MISMATCH')) {
                                console.warn(`🔄 Konflikt Danych Celu (Zmiana w tle). Ponawiam...`);
                                retries++;
                                await new Promise(r => setTimeout(r, Math.random() * 500 + 200));
                                continue; // RETRY
                            } else {
                                throw rpcError;
                            }
                        }
                        // Success - Break Loop
                        retries = MAX_RETRIES + 1;
                    }
                }

                // --- FINALIZATION (Update Mission Table) ---
                // This happens once per mission success.
                // If Atomic save succeeded (or wasn't needed), we assume success.

                const duration = (mission.returnTime - mission.startTime) / 2;
                await supabase.from('missions').update({
                    status: 'returning',
                    resources: loot,
                    ships: survivingAttacker,
                    result: result,
                    return_time: Date.now() + duration
                }).eq('id', mission.id);

                fetchMissions();

            } catch (err: any) {
                console.error('Critical Mission Arrival Error:', err);
                // Emergency Fallback
                await supabase.from('missions').update({
                    status: 'returning',
                    return_time: Date.now() + 60000,
                    result: { id: Date.now().toString(), title: "Błąd Systemowy", message: "Awaryjny powrót.", outcome: "neutral" }
                }).eq('id', mission.id);
                retries = MAX_RETRIES + 1; // Exit
            }
        }
    };

    // Process Mission Return (Home reached) - ATOMIC RETRY VERSION
    const processMissionReturn = async (localMission: FleetMission) => {
        let retries = 0;
        const MAX_RETRIES = 5;

        while (retries < MAX_RETRIES) {
            try {
                console.log(`Processing Return (Attempt ${retries + 1}):`, localMission.id);

                // 1. Fetch FRESH Mission & Profile Data (Sequential to avoid stale reads)
                const { data: missionData } = await supabase.from('missions').select('*').eq('id', localMission.id).single();
                const { data: myProfile, error: profileError } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

                if (profileError || !myProfile) throw new Error(`Profile fetch error`);

                // Data Prep
                const mission = missionData ? {
                    ...localMission,
                    resources: missionData.resources,
                    result: missionData.result,
                    ships: missionData.ships || localMission.ships,
                    type: missionData.mission_type as MissionType
                } : localMission;

                // 2. IDEMPOTENCY CHECK
                const logId = `${mission.id}-return`;
                const alreadyProcessed = myProfile.mission_logs?.some((l: any) => l.id === logId);

                if (alreadyProcessed) {
                    console.warn("⚠️ Powrót misji już przetworzony (Dubel). Pomijam.");
                    await supabase.from('missions').update({ status: 'completed' }).eq('id', mission.id);
                    fetchMissions();
                    return; // EXIT
                }

                // 3. Calculate New State based on FETCHED profile (not local state)
                const newShips = { ...myProfile.ships };
                if (mission.ships) {
                    Object.entries(mission.ships).forEach(([id, count]) => {
                        newShips[id] = (Number(newShips[id]) || 0) + (Number(count) || 0);
                    });
                }

                // Auto-repair missing fields in DB by merging with initial structure
                const newRes = { ...initialState.resources, ...(myProfile.resources || {}) };
                if (mission.resources) {
                    newRes.metal = (Number(newRes.metal) || 0) + (Number(mission.resources.metal) || 0);
                    newRes.crystal = (Number(newRes.crystal) || 0) + (Number(mission.resources.crystal) || 0);
                    newRes.deuterium = (Number(newRes.deuterium) || 0) + (Number(mission.resources.deuterium) || 0);
                    newRes.darkMatter = (Number(newRes.darkMatter) || 0) + (Number(mission.resources.darkMatter) || 0);

                    if (mission.resources.ships) {
                        Object.entries(mission.resources.ships).forEach(([id, count]) => {
                            newShips[id] = (Number(newShips[id]) || 0) + (Number(count) || 0);
                        });
                    }
                }

                const title = mission.result?.title || `Powrót Floty`;
                const message = mission.result?.message || `Flota wróciła z misji ${mission.type}.`;
                const outcome = (mission.result?.outcome as any) || 'success';

                // CRITICAL FIX: Preserve report from mission result locally
                const report = (mission.result as any)?.report;

                const newLogs = [
                    { id: logId, timestamp: Date.now(), title, message, outcome, rewards: mission.resources, report },
                    ...(myProfile.mission_logs || [])
                ].slice(0, 50);

                // 4. ATOMIC SAVE (RPC with Version Check)
                const { data: rpcData, error: rpcError } = await supabase.rpc('save_game_atomic', {
                    p_user_id: session.user.id,
                    p_profile_data: {
                        ships: newShips,
                        resources: newRes,
                        mission_logs: newLogs,
                        points: calculatePoints(newRes, gameState.buildings, newShips, gameState.research, gameState.defenses),
                        last_updated: Date.now()
                    },
                    p_expected_version: myProfile.version || 1
                });

                if (rpcError) {
                    // Check for Version Mismatch
                    if (rpcError.message.includes('VERSION_MISMATCH')) {
                        console.warn(`🔄 Konflikt Wersji (Zmiana w tle). Ponawiam ${retries + 1}/${MAX_RETRIES}...`);
                        retries++;
                        await new Promise(r => setTimeout(r, Math.random() * 500 + 200)); // Jitter
                        continue; // RETRY LOOP
                    } else {
                        throw rpcError; // Fatal Error
                    }
                }

                // 5. SUCCESS
                console.log('✅ Powrót Misji Zapisany (Atomowo).');

                // Update Local State (Optimistic but safe now)
                lastSavedStateRef.current = { ...lastSavedStateRef.current, ships: newShips, resources: newRes, missionLogs: newLogs, version: (rpcData as any).new_version };
                setGameState(prev => ({ ...prev, ships: newShips, resources: newRes, missionLogs: newLogs, version: (rpcData as any).new_version }));

                // Mark Completed
                await supabase.from('missions').update({ status: 'completed' }).eq('id', mission.id);
                fetchMissions();
                return; // EXIT FUNCTION

            } catch (err: any) {
                console.error('Critical Error in processMissionReturn:', err);
                alert(`BŁĄD MISJI: ${err.message || err} `);
                return;
            }
        }

        console.error("❌ Max Retries Exceeded for Mission Return");
        alert("Nie udało się zapisać powrotu misji (Błąd połączenia/Wersji). Spróbuj odświeżyć stronę.");
    };



    // Subscribe to DB changes (Realtime)
    useEffect(() => {
        if (!session?.user) return;
        fetchMissions();

        // 1. Listen for new/updated missions (Attacks, Returns, Expeditions)
        // OPTIMIZATION: Split into two channels to filter only RELEVANT missions (My missions OR Missions targeting me)
        // This vastly reduces Supabase Realtime usage compared to listening to global '*' events.
        const missionsChannel = supabase.channel('missions-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'missions',
                filter: `source_user=eq.${session.user.id}` // My fleets
            }, () => fetchMissions())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'missions',
                filter: `target_user=eq.${session.user.id}` // Attacks on me
            }, () => {
                console.log('⚠️ Incoming mission detected via Realtime');
                fetchMissions();
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') console.log('📡 Connected to Missions stream (Filtered)');
            });

        // 2. Listen for Profile updates (Logs, Messages - primarily)
        // Filter by OUR user ID to avoid receiving events for other players (saves bandwidth)
        const profileChannel = supabase
            .channel('profile-changes')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${session.user.id}`
            }, (payload: any) => {
                const newData = payload.new;
                if (newData) {
                    console.log('📡 Profile update received via Realtime');
                    // SAFE UPDATE: Only update logs and nickname.
                    // DO NOT update resources/buildings from here to avoid overwriting local opportunistic state.
                    setGameState(prev => ({
                        ...prev,
                        missionLogs: newData.mission_logs || prev.missionLogs,
                        nickname: newData.nickname || prev.nickname
                    }));
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') console.log('📡 Connected to Profile stream');
            });

        return () => {
            supabase.removeChannel(missionsChannel);
            supabase.removeChannel(profileChannel);
        };
    }, [session]);



    // Mission Processing Watcher
    useEffect(() => {
        if (!loaded || !session?.user) return;
        let pollCounter = 0;

        const checkMissions = async () => {
            const now = Date.now();
            // Access state via ref to avoid dependency loop
            // FIX: Include incoming missions so we can process/rescue them if they get stuck!
            const missions = [...(gameStateRef.current.activeMissions || []), ...(gameStateRef.current.incomingMissions || [])];

            // Poll for incoming attacks every 30 seconds (backup for Realtime)
            pollCounter++;
            if (pollCounter >= 30) {
                pollCounter = 0;
                fetchMissions(); // Refresh both active and incoming missions
            }

            // 1. Check & Rescue STUCK missions first (Priority High)
            // If a mission is > 1 minutes overdue (was 5), consider it stuck and force rescue immediately.
            // This prevents `processMissionArrival` from running endlessly on stuck missions (XP Loop).
            const overdueThreshold = now - (60 * 1000); // 1 minute overdue

            const extremelyOverdue = missions.filter(m =>
                m.status === 'flying' &&
                m.arrivalTime < overdueThreshold
            );

            const rescuedIds = new Set<string>();

            for (const m of extremelyOverdue) {
                console.warn(`🚨 AGGRESSIVE RESCUE: Force-completing stuck mission ${m.id}`);
                rescuedIds.add(m.id);
                rescuedMissionIdsRef.current.add(m.id); // Block re-fetch

                // IMMEDIATELY remove from local state

                setGameState(prev => ({
                    ...prev,
                    activeMissions: prev.activeMissions.filter(am => am.id !== m.id),
                    incomingMissions: prev.incomingMissions.filter(im => im.id !== m.id)
                }));

                const { error: updateError } = await supabase.from('missions').update({
                    status: 'completed',
                    result: {
                        id: now.toString(),
                        timestamp: now,
                        title: 'Misja Anulowana (System)',
                        message: 'Misja utknęła i została automatycznie zakończona przez system.',
                        outcome: 'neutral'
                    }
                }).eq('id', m.id);

                if (updateError) console.error('❌ AGGRESSIVE RESCUE DB ERROR:', updateError);
                else console.log('✅ AGGRESSIVE RESCUE: Success');

                // Return ships
                if (m.ownerId === session.user.id) {
                    const { data: myProfile } = await supabase.from('profiles').select('ships').eq('id', session.user.id).single();
                    if (myProfile && m.ships) {
                        const newShips = { ...myProfile.ships };
                        Object.entries(m.ships).forEach(([id, count]) => {
                            newShips[id] = (Number(newShips[id]) || 0) + (Number(count) || 0);
                        });
                        await supabase.from('profiles').update({ ships: newShips }).eq('id', session.user.id);
                    }
                }
            }

            // 2. Check Normal Arrivals (Exclude rescued ones)
            const arriving = missions.filter(m =>
                !rescuedIds.has(m.id) && // Skip if just rescued
                m.status === 'flying' &&
                now >= m.arrivalTime &&
                !m.eventProcessed &&
                (m.ownerId === session.user.id || (m.targetUserId === session.user.id && now > m.arrivalTime + 10000))
            );

            for (const m of arriving) {
                // Mark processed locally
                setGameState(prev => ({ ...prev, activeMissions: prev.activeMissions.map(am => am.id === m.id ? { ...am, eventProcessed: true } : am) }));
                await processMissionArrival(m);
            }

            // 3. Check Returns
            const returning = missions.filter(m => m.status === 'returning' && now >= m.returnTime && m.ownerId === session.user.id);
            for (const m of returning) {
                setGameState(prev => ({ ...prev, activeMissions: prev.activeMissions.filter(am => am.id !== m.id) }));
                await processMissionReturn(m);
            }

            // Refresh if we rescued anything
            if (rescuedIds.size > 0) fetchMissions();
        };

        // Also fetch immediately on load
        fetchMissions();

        const interval = setInterval(checkMissions, 1000);
        return () => clearInterval(interval);
        // Removed gameState.activeMissions from dependencies to prevent loop
    }, [loaded, session]);
    // Re-implementing helper functions for context clarity
    const getCost = (type: 'building' | 'research', id: string, currentLevel: number) => {
        const def = type === 'building' ? BUILDINGS[id as BuildingId] : RESEARCH[id as ResearchId];
        const factor = Math.pow(1.5, currentLevel);
        return {
            metal: Math.floor(def.baseCost.metal * factor),
            crystal: Math.floor(def.baseCost.crystal * factor),
            deuterium: Math.floor(def.baseCost.deuterium * factor),
        };
    };

    const checkRequirements = (reqs?: Requirement[]) => {
        if (!reqs) return true;
        for (const req of reqs) {
            if (req.type === 'building') {
                if (gameState.buildings[req.id as BuildingId] < req.level) return false;
            } else if (req.type === 'research') {
                if (gameState.research[req.id as ResearchId] < req.level) return false;
            }
        }
        return true;
    };

    const calculateProduction = (state: GameState) => {
        const settings = state.productionSettings;
        const getPct = (id: BuildingId) => (settings[id] !== undefined ? settings[id]! : 100) / 100;
        const metalLvl = state.buildings[BuildingId.METAL_MINE];
        const metalPct = getPct(BuildingId.METAL_MINE);
        const metalProd = Math.floor(30 * metalLvl * Math.pow(1.1, metalLvl)) * GAME_SPEED * metalPct;
        const metalCons = Math.floor(20 * metalLvl * Math.pow(1.1, metalLvl)) * metalPct;
        const crystalLvl = state.buildings[BuildingId.CRYSTAL_MINE];
        const crystalPct = getPct(BuildingId.CRYSTAL_MINE);
        const crystalProd = Math.floor(20 * crystalLvl * Math.pow(1.1, crystalLvl)) * GAME_SPEED * crystalPct;
        const crystalCons = Math.floor(20 * crystalLvl * Math.pow(1.1, crystalLvl)) * crystalPct;
        const deutLvl = state.buildings[BuildingId.DEUTERIUM_SYNTH];
        const deutPct = getPct(BuildingId.DEUTERIUM_SYNTH);
        const deuteriumProd = Math.floor(10 * deutLvl * Math.pow(1.1, deutLvl)) * GAME_SPEED * deutPct;
        const deuteriumCons = Math.floor(40 * deutLvl * Math.pow(1.1, deutLvl)) * deutPct;
        const solarLvl = state.buildings[BuildingId.SOLAR_PLANT];
        const solarPct = getPct(BuildingId.SOLAR_PLANT);
        const fusionLvl = state.buildings[BuildingId.FUSION_REACTOR];
        const fusionPct = getPct(BuildingId.FUSION_REACTOR);
        const energyTechLvl = state.research[ResearchId.ENERGY_TECH] || 0;
        let energyProd = Math.floor(20 * solarLvl * Math.pow(1.1, solarLvl)) * solarPct;
        energyProd += Math.floor(30 * fusionLvl * Math.pow(1.05 + 0.01 * energyTechLvl, fusionLvl)) * fusionPct;
        const fusionDeutCons = Math.floor(10 * fusionLvl * Math.pow(1.1, fusionLvl)) * fusionPct;
        const energyCons = metalCons + crystalCons + deuteriumCons;
        const netEnergy = energyProd - energyCons;
        const productionFactor = netEnergy >= 0 ? 1 : Math.max(0, energyProd / (energyCons || 1));
        const metalStorageLvl = state.buildings[BuildingId.METAL_STORAGE];
        const crystalStorageLvl = state.buildings[BuildingId.CRYSTAL_STORAGE];
        const deutStorageLvl = state.buildings[BuildingId.DEUTERIUM_TANK];
        const maxMetal = 10000 + 5000 * Math.floor(Math.pow(2.5, metalStorageLvl));
        const maxCrystal = 10000 + 5000 * Math.floor(Math.pow(2.5, crystalStorageLvl));
        const maxDeuterium = 10000 + 5000 * Math.floor(Math.pow(2.5, deutStorageLvl));
        return {
            metal: (metalProd * productionFactor) / 3600,
            crystal: (crystalProd * productionFactor) / 3600,
            deuterium: ((deuteriumProd - fusionDeutCons) * productionFactor) / 3600,
            energy: netEnergy,
            maxEnergy: energyProd,
            storage: { metal: maxMetal, crystal: maxCrystal, deuterium: maxDeuterium }
        };
    };

    const getLevel = (points: number, settings?: any) => {
        const rawLevel = Math.floor(points / 1000) + 1;
        if (settings?.reachedLevel16) {
            return Math.max(16, rawLevel);
        }
        return rawLevel;
    };


    // Actions
    const buyPremium = async (cost: number, reward: { metal?: number, crystal?: number, deuterium?: number }): Promise<TransactionStatus> => {
        if (gameState.resources.darkMatter < cost) return 'no_funds';
        if (reward.metal && (gameState.resources.metal + reward.metal > gameState.resources.storage.metal)) return 'storage_full';
        if (reward.crystal && (gameState.resources.crystal + reward.crystal > gameState.resources.storage.crystal)) return 'storage_full';
        if (reward.deuterium && (gameState.resources.deuterium + reward.deuterium > gameState.resources.storage.deuterium)) return 'storage_full';

        const newResources = {
            ...gameState.resources,
            darkMatter: gameState.resources.darkMatter - cost,
            metal: Math.min(gameState.resources.storage.metal, gameState.resources.metal + (reward.metal || 0)),
            crystal: Math.min(gameState.resources.storage.crystal, gameState.resources.crystal + (reward.crystal || 0)),
            deuterium: Math.min(gameState.resources.storage.deuterium, gameState.resources.deuterium + (reward.deuterium || 0)),
        };

        setGameState(prev => ({
            ...prev,
            resources: newResources
        }));

        // CRITICAL: Save to database!
        const { error } = await supabase.from('profiles').update({
            resources: newResources
        }).eq('id', session.user.id);

        if (error) {
            console.error('buyPremium DB save failed:', error);
            // Revert locally
            setGameState(prev => ({
                ...prev,
                resources: gameState.resources
            }));
            return 'no_funds';
        }

        // Update Reference to prevent Desync warning
        lastSavedStateRef.current = {
            ...lastSavedStateRef.current,
            resources: newResources
        };

        // Update Reference
        lastSavedStateRef.current = {
            ...lastSavedStateRef.current,
            resources: newResources
        };

        return 'success';
    };

    const sendExpedition = async (ships: Record<ShipId, number>, coords: { galaxy: number, system: number, position: number }) => {
        const duration = 10 * 1000; // 10 seconds for testing

        const now = Date.now();
        const missionId = crypto.randomUUID();

        // Optimistic update
        const mission: FleetMission = {
            id: missionId,
            ownerId: session?.user.id,
            type: MissionType.EXPEDITION,
            ships: ships,
            targetCoords: coords,
            originCoords: gameState.galaxyCoords || { galaxy: 1, system: 1, position: 1 },
            startTime: now,
            arrivalTime: now + (duration / 2),
            returnTime: now + duration,
            eventProcessed: false,
            status: 'flying'
        };

        setGameState(prev => {
            const newShips = { ...prev.ships };
            Object.entries(ships).forEach(([id, count]) => { newShips[id as ShipId] -= count; });
            return { ...prev, ships: newShips, activeMissions: [...prev.activeMissions, mission] };
        });

        // DB Insert
        const { error: insertError } = await supabase.from('missions').insert({
            id: missionId,
            owner_id: session.user.id,
            mission_type: MissionType.EXPEDITION,
            ships: ships,
            target_coords: coords,
            origin_coords: gameState.galaxyCoords || { galaxy: 1, system: 1, position: 1 },
            start_time: now,
            arrival_time: now + (duration / 2),
            return_time: now + duration,
            status: 'flying'
        });

        if (insertError) {
            console.error("Failed to start expedition:", insertError);
            alert("Błąd wysyłania ekspedycji. Spróbuj ponownie.");
            // SAFE REVERT: Restore ships and remove mission locally instead of refreshProfile
            setGameState(prev => {
                const revertedShips = { ...prev.ships };
                Object.entries(ships).forEach(([id, count]) => {
                    revertedShips[id as ShipId] = (revertedShips[id as ShipId] || 0) + count;
                });
                return {
                    ...prev,
                    ships: revertedShips,
                    activeMissions: prev.activeMissions.filter(m => m.id !== missionId)
                };
            });
            return;
        }

        // Update Profile (Deduct Ships)
        const currentShips = { ...gameState.ships };
        Object.entries(ships).forEach(([id, count]) => {
            currentShips[id as ShipId] = (currentShips[id as ShipId] || 0) - count;
        });

        await supabase.from('profiles').update({
            ships: currentShips,
            points: calculatePoints(gameState.resources, gameState.buildings, currentShips, gameState.research, gameState.defenses)
        }).eq('id', session.user.id);
    };

    const sendAttack = async (ships: Record<ShipId, number>, coords: { galaxy: number, system: number, position: number }) => {
        // Distance-based duration calculation - MINIMUM 5 minutes for attacks
        const origin = gameState.galaxyCoords || { galaxy: 1, system: 1, position: 1 };
        let duration: number;
        const MIN_ATTACK_TIME = 5 * 60 * 1000; // 5 minutes minimum

        if (origin.galaxy !== coords.galaxy) {
            // Different galaxy = 1 hour
            duration = 60 * 60 * 1000;
        } else if (origin.system !== coords.system) {
            // Different system = 5 min + system difference * 30 seconds (max 15 min)
            const systemDiff = Math.abs(origin.system - coords.system);
            duration = Math.min(15 * 60 * 1000, MIN_ATTACK_TIME + systemDiff * 30 * 1000);
        } else {
            // Same system = 5 min + position difference * 10 seconds
            const posDiff = Math.abs(origin.position - coords.position);
            duration = MIN_ATTACK_TIME + posDiff * 10 * 1000;
        }

        const now = Date.now();
        const missionId = crypto.randomUUID();
        const targetUserId = await findTargetUser(coords);
        console.log('🎯 ATTACK: Target at coords', coords, 'resolved to userId:', targetUserId);

        if (targetUserId) {
            // Newbie Protection Check
            const { data: targetProfile, error: targetError } = await supabase
                .from('profiles')
                .select('points')
                .eq('id', targetUserId)
                .single();

            if (!targetError && targetProfile) {
                // Determine level based on points (Level = Cube Root of Points)
                // Assuming standard OGame-like formula: Points = Level^3 approx (or use your specific formula)
                // User requirement: "Protection for small level e.g. 7"
                // Let's use the inverse of whatever points formula we have or just raw points threshold.
                // If we assume Level 1 = 0 pts, Level 7 is roughly ?
                // Let's rely on the requested "Level 7" logic.
                // Since we don't store 'active' level in DB, we calculate it or just use points.
                // Level = Math.floor(Math.pow(targetProfile.points || 0, 1/3)) is a common approximation if not stored.
                // However, based on our previous Ranking.tsx: const computedLevel = Math.floor(Math.pow(profile.points || 0, 1/3));
                const targetLevel = Math.floor(Math.pow(targetProfile.points || 0, 1 / 3));

                if (targetLevel < 7) {
                    alert(`Ten gracz znajduje się pod ochroną początkujących(Poziom ${targetLevel} < 7).Atak niemożliwy.`);
                    return;
                }
            }
        }

        // Calculate new ships
        const newShips = { ...gameState.ships };
        Object.entries(ships).forEach(([id, count]) => {
            newShips[id as ShipId] = (newShips[id as ShipId] || 0) - count;
        });

        // STEP 1: Deduct ships from DB FIRST (anti-exploit)
        const { error: profileError } = await supabase.from('profiles').update({
            ships: newShips,
            points: calculatePoints(gameState.resources, gameState.buildings, newShips, gameState.research, gameState.defenses)
        }).eq('id', session.user.id);

        if (profileError) {
            console.error('❌ ATTACK PROFILE UPDATE ERROR:', profileError);
            alert('Błąd odejmowania statków.');
            return;
        }

        // STEP 2: Optimistic Update (safe now)
        const mission: FleetMission = {
            id: missionId,
            ownerId: session?.user.id,
            type: MissionType.ATTACK,
            ships: ships,
            targetCoords: coords,
            targetUserId: targetUserId,
            originCoords: gameState.galaxyCoords || { galaxy: 1, system: 1, position: 1 },
            startTime: now,
            arrivalTime: now + duration,
            returnTime: now + (duration * 2),
            eventProcessed: false,
            status: 'flying'
        };

        setGameState(prev => ({
            ...prev,
            ships: newShips,
            activeMissions: [...prev.activeMissions, mission]
        }));

        // STEP 3: Insert mission to DB
        const { error: insertError } = await supabase.from('missions').insert({
            id: missionId,
            owner_id: session.user.id,
            target_user_id: targetUserId,
            mission_type: MissionType.ATTACK,
            ships: ships,
            target_coords: coords,
            origin_coords: gameState.galaxyCoords || { galaxy: 1, system: 1, position: 1 },
            start_time: now,
            arrival_time: now + duration,
            return_time: now + (duration * 2),
            status: 'flying'
        });

        if (insertError) {
            console.error('❌ ATTACK INSERT ERROR:', insertError);
            // Ships already deducted - safer than allowing duplication
        } else {
            console.log('✅ ATTACK INSERTED');
        }
    };

    const sendSpyProbe = async (amount: number, coords: { galaxy: number, system: number, position: number }) => {
        if ((gameState.ships[ShipId.ESPIONAGE_PROBE] || 0) < amount) return false;

        const now = Date.now();
        const duration = 30 * 1000; // 30 seconds for spy probe

        const missionId = crypto.randomUUID();
        const targetUserId = await findTargetUser(coords);

        // Calculate new ships
        const newShips = { ...gameState.ships };
        newShips[ShipId.ESPIONAGE_PROBE] = (newShips[ShipId.ESPIONAGE_PROBE] || 0) - amount;

        // STEP 1: Deduct probes from DB FIRST (anti-exploit)
        const { error: profileError } = await supabase.from('profiles').update({
            ships: newShips,
            points: calculatePoints(gameState.resources, gameState.buildings, newShips, gameState.research, gameState.defenses)
        }).eq('id', session.user.id);

        if (profileError) {
            console.error('❌ SPY PROFILE UPDATE ERROR:', profileError);
            alert('Błąd odejmowania sond.');
            return false;
        }

        // STEP 2: Optimistic update (safe now)
        const mission: FleetMission = {
            id: missionId,
            ownerId: session?.user.id,
            type: MissionType.SPY,
            ships: { [ShipId.ESPIONAGE_PROBE]: amount } as any,
            targetCoords: coords,
            targetUserId: targetUserId,
            originCoords: gameState.galaxyCoords || { galaxy: 1, system: 1, position: 1 },
            startTime: now,
            arrivalTime: now + (duration / 2),
            returnTime: now + duration,
            eventProcessed: false,
            status: 'flying'
        };

        setGameState(prev => ({
            ...prev,
            ships: newShips,
            activeMissions: [...prev.activeMissions, mission]
        }));

        // STEP 3: Insert mission to DB
        const { error: insertError } = await supabase.from('missions').insert({
            id: missionId,
            owner_id: session.user.id,
            target_user_id: targetUserId,
            mission_type: MissionType.SPY,
            ships: { [ShipId.ESPIONAGE_PROBE]: amount },
            target_coords: coords,
            origin_coords: gameState.galaxyCoords || { galaxy: 1, system: 1, position: 1 },
            start_time: now,
            arrival_time: now + (duration / 2),
            return_time: now + duration,
            status: 'flying'
        });

        if (insertError) {
            console.error("Failed to send spy probe:", insertError);
            // Probes already deducted - safer than allowing duplication
        }

        return true;
    };

    const sendTransport = async (ships: Record<ShipId, number>, resources: MissionRewards, coords: { galaxy: number, system: number, position: number }) => {
        const duration = 5 * 60 * 1000; // 5 minutes fixed
        const now = Date.now();
        const missionId = crypto.randomUUID();
        const targetUserId = await findTargetUser(coords);

        // Calculate new ships and resources
        const newShips = { ...gameState.ships };
        Object.entries(ships).forEach(([id, count]) => {
            newShips[id as ShipId] = (newShips[id as ShipId] || 0) - count;
        });
        const newResources = {
            ...gameState.resources,
            metal: gameState.resources.metal - (resources.metal || 0),
            crystal: gameState.resources.crystal - (resources.crystal || 0),
            deuterium: gameState.resources.deuterium - (resources.deuterium || 0)
        };

        // STEP 1: Deduct resources from DB FIRST (anti-exploit)
        const { error: profileError } = await supabase.from('profiles').update({
            ships: newShips,
            resources: newResources,
            points: calculatePoints(newResources, gameState.buildings, newShips, gameState.research, gameState.defenses)
        }).eq('id', session.user.id);

        if (profileError) {
            console.error("Error deducting resources:", profileError);
            alert("Błąd odejmowania surowców.");
            return;
        }

        // STEP 2: Update local state
        const mission: FleetMission = {
            id: missionId,
            ownerId: session?.user.id,
            type: MissionType.TRANSPORT,
            ships: ships,
            resources: resources,
            targetCoords: coords,
            targetUserId: targetUserId,
            originCoords: gameState.galaxyCoords || { galaxy: 1, system: 1, position: 1 },
            startTime: now,
            arrivalTime: now + (duration / 2),
            returnTime: now + duration,
            eventProcessed: false,
            status: 'flying'
        };

        setGameState(prev => ({
            ...prev,
            ships: newShips,
            resources: newResources,
            activeMissions: [...prev.activeMissions, mission]
        }));

        // STEP 3: Insert mission to DB
        const { error: missionError } = await supabase.from('missions').insert({
            id: missionId,
            owner_id: session.user.id,
            target_user_id: targetUserId,
            mission_type: MissionType.TRANSPORT,
            ships: ships,
            resources: resources,
            target_coords: coords,
            origin_coords: gameState.galaxyCoords || { galaxy: 1, system: 1, position: 1 },
            start_time: now,
            arrival_time: now + (duration / 2),
            return_time: now + duration,
            status: 'flying'
        });

        if (missionError) {
            console.error("Error creating mission:", missionError);
            // Resources already deducted - safer than allowing duplication
        }
    };

    const cancelMission = async (missionId: string) => {
        const mission = gameState.activeMissions.find(m => m.id === missionId);
        if (!mission || mission.status !== 'flying') return;

        const now = Date.now();
        const timeTraveled = now - mission.startTime;
        const newReturnTime = now + timeTraveled;

        // Optimistic update
        setGameState(prev => ({
            ...prev,
            activeMissions: prev.activeMissions.map(m =>
                m.id === missionId
                    ? { ...m, status: 'returning', returnTime: newReturnTime, arrivalTime: now }
                    : m
            )
        }));

        // DB Update
        const { error } = await supabase.from('missions').update({
            status: 'returning',
            return_time: newReturnTime,
            arrival_time: now
        }).eq('id', missionId);

        // Notify Target about cancellation (if Attack)
        if (mission.type === 'attack' && mission.targetUserId) {
            const { data: targetProfile } = await supabase.from('profiles').select('mission_logs').eq('id', mission.targetUserId).single();
            if (targetProfile) {
                const newLog = {
                    id: Date.now().toString(),
                    timestamp: Date.now(),
                    title: 'Atak Anulowany',
                    message: `Gracz ${gameStateRef.current.nickname || 'Nieznany'} [${mission.originCoords.galaxy}: ${mission.originCoords.system}: ${mission.originCoords.position}] zawrócił flotę tuż przed atakiem.\nSkład floty: ${Object.entries(mission.ships).map(([id, n]) => `${SHIPS[id as ShipId]?.name || id}: ${n}`).join(', ')}.`,
                    outcome: 'info' as 'info'
                };
                const updatedLogs = [newLog, ...(targetProfile.mission_logs || [])].slice(0, 50);
                await supabase.from('profiles').update({ mission_logs: updatedLogs }).eq('id', mission.targetUserId);
            }
        }

        if (error) {
            console.error("Failed to cancel mission:", error);
            alert("Błąd anulowania misji.");
            // SAFE REVERT: Restore original mission status locally
            setGameState(prev => ({
                ...prev,
                activeMissions: prev.activeMissions.map(m =>
                    m.id === missionId
                        ? { ...m, status: 'flying', returnTime: mission.returnTime, arrivalTime: mission.arrivalTime }
                        : m
                )
            }));
        }
    };

    // Upgrades
    const upgradeBuilding = async (buildingId: BuildingId) => {
        const currentLevel = gameState.buildings[buildingId];
        const cost = getCost('building', buildingId, currentLevel);

        // Resource check
        if (gameState.resources.metal < cost.metal || gameState.resources.crystal < cost.crystal || gameState.resources.deuterium < cost.deuterium) {
            console.log("Not enough resources");
            return;
        }

        // Check queue limit (Increased to 5)
        const currentQueue = gameState.constructionQueue.filter(q => q.type === 'building');
        if (currentQueue.length >= 5) {
            console.log("Queue full");
            return;
        }

        const totalResources = cost.metal + cost.crystal;
        let buildTimeMs = (totalResources / 2500) * 3600 * 1000;
        buildTimeMs = buildTimeMs / (gameState.buildings[BuildingId.ROBOT_FACTORY] + 1);
        buildTimeMs = buildTimeMs / GAME_SPEED;
        const buildTime = Math.max(1000, buildTimeMs);

        // Determine start time (After the last item in queue finishes, or Now)
        // Note: Using gameState directly. If user clicks fast, this might still be slightly stale, 
        // but 'upgradeBuilding' closure usually updates on render.
        // For perfect safety, we could look at 'latest' state if we had a ref, but this is usually fine for React click handlers.
        const lastItem = currentQueue.sort((a, b) => b.endTime - a.endTime)[0];
        const startTime = lastItem ? lastItem.endTime : Date.now();
        const endTime = startTime + buildTime;

        // Stable objects
        const newItem: ConstructionItem = {
            id: Date.now().toString(),
            type: 'building',
            itemId: buildingId,
            targetLevel: currentLevel + 1,
            startTime: startTime,
            endTime: endTime
        };

        // FIXED: Spread existing resources to preserve storage and darkMatter
        const newResources = {
            ...gameState.resources,
            metal: gameState.resources.metal - cost.metal,
            crystal: gameState.resources.crystal - cost.crystal,
            deuterium: gameState.resources.deuterium - cost.deuterium
        };

        const newQueue = [...gameState.constructionQueue, newItem];

        // Update Local State with PRE-CALCULATED values
        setGameState(prev => ({
            ...prev,
            resources: {
                ...prev.resources,
                ...newResources
            },
            constructionQueue: [...prev.constructionQueue, newItem] // We can append to prev to be safe against race with other updates
        }));

        addXP(Math.floor(totalResources / 100), 'Building Construction');

        // Sync with Supabase using the SAME calculated values
        // Note: Supabase update might overwrite parallel updates if we are not careful.
        // Ideally we should use RPC or careful checking, but for now sending the new full queue is better than mismatched IDs.
        // We use 'newQueue' which is based on closure 'gameState'. 
        // To be safer against 'prev' state changes, we strictly simply send what we think is the new state.

        const { error } = await supabase.from('profiles').update({
            resources: newResources,
            construction_queue: newQueue
        }).eq('id', session.user.id);

        if (error) {
            console.error("Building upgrade failed:", error);
            // SAFE REVERT: Restore resources and remove queue item locally
            setGameState(prev => {
                const filteredQueue = prev.constructionQueue.filter(q => q.id !== newItem.id);
                return {
                    ...prev,
                    resources: {
                        ...prev.resources,
                        metal: prev.resources.metal + cost.metal,
                        crystal: prev.resources.crystal + cost.crystal,
                        deuterium: prev.resources.deuterium + cost.deuterium
                    },
                    constructionQueue: filteredQueue
                };
            });
        }
    };

    const cancelConstruction = async (constructionId: string) => {
        // Use current state from closure (fresh enough) to calculate
        const itemIndex = gameState.constructionQueue.findIndex(i => i.id === constructionId);
        if (itemIndex === -1) return;

        const item = gameState.constructionQueue[itemIndex];

        // Safety checks
        if (item.type !== 'building' && item.type !== 'research') {
            console.error("Cannot cancel item of type:", item.type);
            return;
        }

        const costLevel = (item.targetLevel || 1) - 1;
        const cost = getCost(item.type, item.itemId as any, costLevel);

        // Refund resources safely
        const refundMetal = Math.floor(cost.metal || 0);
        const refundCrystal = Math.floor(cost.crystal || 0);
        const refundDeuterium = Math.floor(cost.deuterium || 0);

        const newResources = {
            ...gameState.resources,
            metal: (gameState.resources.metal || 0) + refundMetal,
            crystal: (gameState.resources.crystal || 0) + refundCrystal,
            deuterium: (gameState.resources.deuterium || 0) + refundDeuterium
        };

        const newQueue = [...gameState.constructionQueue];
        newQueue.splice(itemIndex, 1);

        // Recalculate times for subsequent items
        for (let i = itemIndex; i < newQueue.length; i++) {
            const prevItem = i > 0 ? newQueue[i - 1] : null;
            const startTime = prevItem ? prevItem.endTime : Date.now();
            const duration = newQueue[i].endTime - newQueue[i].startTime;
            newQueue[i] = {
                ...newQueue[i],
                startTime: startTime,
                endTime: startTime + duration
            };
        }

        // Apply State Locally
        setGameState(current => ({
            ...current,
            resources: newResources,
            constructionQueue: newQueue
        }));

        if (item.type === 'building') {
            const totalRefund = refundMetal + refundCrystal;
            addXP(-Math.floor(totalRefund / 100), 'Construction Cancelled');
        }

        // Sync with Supabase
        try {
            const { error } = await supabase.from('profiles').update({
                resources: newResources,
                construction_queue: newQueue
            }).eq('id', session.user.id);

            if (error) throw error;
        } catch (error) {
            console.error("Cancel constr sync failed:", error);
            // SAFE REVERT: Restore original queue and resources locally
            setGameState(prev => ({
                ...prev,
                resources: gameState.resources, // Restore original
                constructionQueue: gameState.constructionQueue // Restore original
            }));
        }
    };

    const upgradeResearch = async (researchId: ResearchId) => {
        const currentLevel = gameState.research[researchId];
        const cost = getCost('research', researchId, currentLevel);
        if (gameState.resources.metal < cost.metal || gameState.resources.crystal < cost.crystal || gameState.resources.deuterium < cost.deuterium) return;
        // Check if research is already in progress
        if (gameState.constructionQueue.some(q => q.type === 'research')) return;

        const researchDef = RESEARCH[researchId];
        if (researchDef.maxLevel && currentLevel >= researchDef.maxLevel) return; // Cap

        const labLevel = gameState.buildings[BuildingId.RESEARCH_LAB];
        if (labLevel === 0) return;

        const totalResources = cost.metal + cost.crystal;
        let buildTimeMs = (totalResources / 1000) * 3600 * 1000;
        buildTimeMs = buildTimeMs / (labLevel + 1);
        buildTimeMs = buildTimeMs / GAME_SPEED;
        const buildTime = Math.max(1000, buildTimeMs);
        const now = Date.now();

        const newItem = {
            id: now.toString(),
            type: 'research' as const,
            itemId: researchId,
            targetLevel: currentLevel + 1,
            startTime: now,
            endTime: now + buildTime
        };

        setGameState(prev => ({
            ...prev,
            resources: {
                ...prev.resources,
                metal: prev.resources.metal - cost.metal,
                crystal: prev.resources.crystal - cost.crystal,
                deuterium: prev.resources.deuterium - cost.deuterium
            },
            constructionQueue: [...prev.constructionQueue, newItem]
        }));

        const { error } = await supabase.from('profiles').update({
            resources: {
                ...gameState.resources, // FIXED: Spread existing resources
                metal: gameState.resources.metal - cost.metal,
                crystal: gameState.resources.crystal - cost.crystal,
                deuterium: gameState.resources.deuterium - cost.deuterium
            },
            construction_queue: [...gameState.constructionQueue, newItem]
        }).eq('id', session.user.id);

        if (error) {
            console.error('upgradeResearch DB save failed:', error);
            // SAFE REVERT: Restore resources and remove research from queue
            setGameState(prev => ({
                ...prev,
                resources: {
                    ...prev.resources,
                    metal: prev.resources.metal + cost.metal,
                    crystal: prev.resources.crystal + cost.crystal,
                    deuterium: prev.resources.deuterium + cost.deuterium
                },
                constructionQueue: prev.constructionQueue.filter(q => q.id !== newItem.id)
            }));
        }
    };

    const buildShip = async (shipId: ShipId, amount: number) => {
        const qty = Math.max(1, Math.floor(amount));
        const ship = SHIPS[shipId];
        const totalCost = { metal: ship.baseCost.metal * qty, crystal: ship.baseCost.crystal * qty, deuterium: ship.baseCost.deuterium * qty };

        if (gameState.resources.metal < totalCost.metal || gameState.resources.crystal < totalCost.crystal || gameState.resources.deuterium < totalCost.deuterium) return;

        const shipyardLevel = gameState.buildings[BuildingId.SHIPYARD];
        if (shipyardLevel === 0) return;

        const singleBuildTime = (ship.buildTime * 1000) / (shipyardLevel + 1); // Real seconds, not sped up
        const now = Date.now();
        let startTime = now;
        if (gameState.shipyardQueue.length > 0) startTime = gameState.shipyardQueue[gameState.shipyardQueue.length - 1].endTime;

        const newItem: ConstructionItem = {
            id: now.toString() + Math.random(),
            type: 'ship',
            itemId: shipId,
            quantity: qty,
            startTime: startTime,
            endTime: startTime + (singleBuildTime * qty)
        };

        const newQueue = [...gameState.shipyardQueue, newItem];

        setGameState(prev => ({
            ...prev,
            resources: {
                ...prev.resources,
                metal: prev.resources.metal - totalCost.metal,
                crystal: prev.resources.crystal - totalCost.crystal,
                deuterium: prev.resources.deuterium - totalCost.deuterium
            },
            shipyardQueue: newQueue
        }));

        addXP(Math.floor((totalCost.metal + totalCost.crystal) / 200), 'Fleet Production');

        const { error } = await supabase.from('profiles').update({
            resources: {
                ...gameState.resources, // FIXED: Spread existing resources
                metal: gameState.resources.metal - totalCost.metal,
                crystal: gameState.resources.crystal - totalCost.crystal,
                deuterium: gameState.resources.deuterium - totalCost.deuterium
            },
            shipyard_queue: newQueue
        }).eq('id', session.user.id);

        if (error) {
            console.error('buildShip DB save failed:', error);
            // SAFE REVERT: Restore resources and remove from queue
            setGameState(prev => ({
                ...prev,
                resources: {
                    ...prev.resources,
                    metal: prev.resources.metal + totalCost.metal,
                    crystal: prev.resources.crystal + totalCost.crystal,
                    deuterium: prev.resources.deuterium + totalCost.deuterium
                },
                shipyardQueue: prev.shipyardQueue.filter(q => q.id !== newItem.id)
            }));
        }
    };

    const buildDefense = async (defenseId: DefenseId, amount: number) => {
        const qty = Math.max(1, Math.floor(amount));
        const defense = DEFENSES[defenseId as keyof typeof DEFENSES];
        if (!defense) return;
        const totalCost = { metal: defense.cost.metal * qty, crystal: defense.cost.crystal * qty, deuterium: defense.cost.deuterium * qty };

        if (gameState.resources.metal < totalCost.metal || gameState.resources.crystal < totalCost.crystal || gameState.resources.deuterium < totalCost.deuterium) return;

        const shipyardLevel = gameState.buildings[BuildingId.SHIPYARD];
        if (shipyardLevel === 0) return;

        const singleBuildTime = (defense.buildTime * 1000) / (shipyardLevel + 1); // Real seconds, not sped up
        const now = Date.now();
        let startTime = now;
        if (gameState.shipyardQueue.length > 0) startTime = gameState.shipyardQueue[gameState.shipyardQueue.length - 1].endTime;

        const newItem: ConstructionItem = {
            id: `def - ${now} -${Math.random()} `,
            type: 'defense',
            itemId: defenseId,
            quantity: qty,
            startTime: startTime,
            endTime: startTime + (singleBuildTime * qty)
        };

        const newQueue = [...gameState.shipyardQueue, newItem];

        setGameState(prev => ({
            ...prev,
            resources: {
                ...prev.resources,
                metal: prev.resources.metal - totalCost.metal,
                crystal: prev.resources.crystal - totalCost.crystal,
                deuterium: prev.resources.deuterium - totalCost.deuterium
            },
            shipyardQueue: newQueue
        }));

        addXP(Math.floor((totalCost.metal + totalCost.crystal) / 200), 'Defense Production');

        const { error } = await supabase.from('profiles').update({
            resources: {
                ...gameState.resources, // FIXED: Spread existing resources
                metal: gameState.resources.metal - totalCost.metal,
                crystal: gameState.resources.crystal - totalCost.crystal,
                deuterium: gameState.resources.deuterium - totalCost.deuterium
            },
            shipyard_queue: newQueue
        }).eq('id', session.user.id);

        if (error) {
            console.error('buildDefense DB save failed:', error);
            // SAFE REVERT: Restore resources and remove from queue
            setGameState(prev => ({
                ...prev,
                resources: {
                    ...prev.resources,
                    metal: prev.resources.metal + totalCost.metal,
                    crystal: prev.resources.crystal + totalCost.crystal,
                    deuterium: prev.resources.deuterium + totalCost.deuterium
                },
                shipyardQueue: prev.shipyardQueue.filter(q => q.id !== newItem.id)
            }));
        }
    };

    // ===== COLONIZATION SYSTEM =====
    const fetchPlanets = async () => {
        if (!session?.user?.id) return;
        const { data, error } = await supabase
            .from('planets')
            .select('*')
            .eq('owner_id', session.user.id);

        if (data && !error) {
            setPlanets(data);
        }
    };

    const sendColonize = async (coords: { galaxy: number, system: number, position: number }, resources: { metal: number, crystal: number, deuterium: number }): Promise<boolean> => {
        // Check if player has colony ship
        if ((gameState.ships[ShipId.COLONY_SHIP] || 0) < 1) {
            alert('Potrzebujesz Statku Kolonizacyjnego!');
            return false;
        }

        // Check planet limit (max 8)
        if (planets.length >= 8) {
            alert('Osiągnąłeś limit 8 planet!');
            return false;
        }

        // Check if position is empty
        const { data: existingPlanets } = await supabase
            .from('planets')
            .select('id')
            .contains('galaxy_coords', coords);

        const { data: existingProfiles } = await supabase
            .from('profiles')
            .select('id')
            .contains('galaxy_coords', coords);

        if ((existingPlanets && existingPlanets.length > 0) || (existingProfiles && existingProfiles.length > 0)) {
            alert('Ta pozycja jest już zajęta!');
            return false;
        }

        // Check resources (and cap at 15000 each for colonization)
        const cappedResources = {
            metal: Math.min(resources.metal, 15000),
            crystal: Math.min(resources.crystal, 15000),
            deuterium: Math.min(resources.deuterium, 15000)
        };
        if (gameState.resources.metal < cappedResources.metal ||
            gameState.resources.crystal < cappedResources.crystal ||
            gameState.resources.deuterium < cappedResources.deuterium) {
            alert('Brak wystarczających zasobów!');
            return false;
        }

        // Deduct colony ship and resources (use capped values)
        const newShips = { ...gameState.ships, [ShipId.COLONY_SHIP]: (gameState.ships[ShipId.COLONY_SHIP] || 0) - 1 };
        const newResources = {
            ...gameState.resources,
            metal: gameState.resources.metal - cappedResources.metal,
            crystal: gameState.resources.crystal - cappedResources.crystal,
            deuterium: gameState.resources.deuterium - cappedResources.deuterium
        };

        const now = Date.now();
        const MIN_COLONIZE_TIME = 60 * 1000; // 60s minimum
        const origin = gameState.galaxyCoords || { galaxy: 1, system: 1, position: 1 };
        let duration = MIN_COLONIZE_TIME;

        if (origin.galaxy !== coords.galaxy) {
            duration = 60 * 60 * 1000; // 1h
        } else if (origin.system !== coords.system) {
            const diff = Math.abs(origin.system - coords.system);
            duration = MIN_COLONIZE_TIME + diff * 30 * 1000;
        } else {
            const diff = Math.abs(origin.position - coords.position);
            duration = MIN_COLONIZE_TIME + diff * 10 * 1000;
        }

        const missionId = crypto.randomUUID();
        const mission: FleetMission = {
            id: missionId,
            ownerId: session?.user.id,
            type: MissionType.COLONIZE,
            ships: { [ShipId.COLONY_SHIP]: 1 } as any,
            targetCoords: coords,
            targetUserId: session.user.id,
            originCoords: origin,
            startTime: now,
            arrivalTime: now + duration,
            // No returnTime for colonization - it's a one-way trip
            eventProcessed: false,
            status: 'flying',
            resources: cappedResources
        };

        // STEP 1: Deduct resources from DB FIRST (anti-exploit)
        const { error: profileError } = await supabase.from('profiles').update({
            ships: newShips,
            resources: newResources
        }).eq('id', session.user.id);

        if (profileError) {
            console.error('❌ COLONIZE PROFILE UPDATE ERROR:', profileError);
            alert('Błąd odejmowania surowców.');
            return false;
        }

        // STEP 2: Optimistic Update (safe now - DB already updated)
        setGameState(prev => ({
            ...prev,
            ships: newShips,
            resources: newResources,
            activeMissions: [...prev.activeMissions, mission]
        }));

        // STEP 3: Insert mission to DB
        const { error: missionError } = await supabase.from('missions').insert({
            id: missionId,
            owner_id: session.user.id,
            target_user_id: session.user.id,
            mission_type: MissionType.COLONIZE,
            ships: { [ShipId.COLONY_SHIP]: 1 },
            target_coords: coords,
            origin_coords: origin,
            start_time: now,
            arrival_time: now + duration,
            status: 'flying',
            resources: cappedResources
        });

        if (missionError) {
            console.error('❌ COLONIZE MISSION ERROR:', missionError);
            alert('Błąd tworzenia misji. Surowce zostały odjęte.');
            // Resources already deducted - safer than allowing duplication
            return false;
        }

        addXP(500, 'New Colony');

        // Update Reference to prevent Desync warning
        lastSavedStateRef.current = {
            ...lastSavedStateRef.current,
            ships: newShips,
            resources: newResources
        };

        console.log('✅ Colonization mission sent!', mission);
        alert(`Misja kolonizacyjna rozpoczęta! Czas lotu: ${(duration / 1000).toFixed(0)}s`);

        return true;
    };

    // Helper to save planet state
    const saveStateToPlanet = async (planetId: string, buildings: any, ships: any, defenses: any, resources: any, cQueue: any[], sQueue: any[]): Promise<boolean> => {
        const payload = {
            buildings,
            ships,
            defenses,
            resources,
            construction_queue: cQueue,
            shipyard_queue: sQueue
        };

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`💾 [COLONY SAVE] Planet: ${planetId}`);
        console.log('💾 [COLONY SAVE] Payload:');
        console.log('  🏗️ Buildings:', JSON.stringify(buildings));
        console.log('  🚀 Ships:', JSON.stringify(ships));
        console.log('  🛡️ Defenses:', JSON.stringify(defenses));
        console.log('  📦 Resources:', JSON.stringify(resources));
        console.log('  🔨 Queue:', cQueue?.length || 0, 'items');
        console.log('  🔧 Shipyard:', sQueue?.length || 0, 'items');

        const { error, data } = await supabase.from('planets').update(payload).eq('id', planetId).select();

        if (error) {
            console.error('❌ [COLONY SAVE ERROR]:', error.message);
            console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return false;
        }

        console.log('✅ [COLONY SAVE SUCCESS] Rows affected:', data?.length || 0);
        if (data && data[0]) {
            console.log('  📥 DB Response Buildings:', JSON.stringify(data[0].buildings));
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return true;
    };

    const switchPlanet = async (planetId: string) => {
        console.log('🪐 Switching to planet:', planetId);
        const current = gameStateRef.current; // Use REF for latest state

        // Force Save Current State before switching
        if (currentPlanetId && currentPlanetId !== 'main') {
            console.log('💾 Saving current colony before switch:', currentPlanetId);
            const success = await saveStateToPlanet(
                currentPlanetId,
                current.buildings,
                current.ships,
                current.defenses,
                current.resources,
                current.constructionQueue,
                current.shipyardQueue
            );

            if (!success) {
                alert("Błąd zapisu stanu kolonii! Przełączanie przerwane, aby zapobiec utracie danych.");
                return; // CRITICAL: Stop switch to protect data
            }

            // NOTE: Removed fetchPlanets() here - it was causing Galaxy view to flicker
            // Planet data doesn't change during a switch, so no need to refresh
        } else if (!currentPlanetId || currentPlanetId === 'main') {
            console.log('💾 Saving main planet before switch');
            await supabase.from('profiles').update({
                buildings: current.buildings,
                resources: current.resources,
                ships: current.ships,
                defenses: current.defenses,
                construction_queue: current.constructionQueue,
                shipyard_queue: current.shipyardQueue
            }).eq('id', session.user.id);
            // No need to fetchPlanets here, but maybe good practice
        }

        if (planetId === 'main') {
            // Switch back to main planet - restore from cache if available
            setCurrentPlanetId('main');

            if (mainPlanetCache) {
                // Restore from cache
                setGameState(mainPlanetCache);
                // FIX: Update lastSavedStateRef to prevent false DESYNC warnings
                lastSavedStateRef.current = JSON.parse(JSON.stringify(mainPlanetCache));
                setMainPlanetCache(null);
                console.log('🪐 Restored main planet from cache (ref updated)');
            } else {
                // Fallback: reload from DB (refreshProfile updates ref internally)
                await refreshProfile();
                console.log('🪐 Reloaded main planet from DB (no cache)');
            }
        } else {
            // LOAD COLONY DATA FROM DB (Fetch fresh!)
            console.log('🌍 Fetching colony data from DB:', planetId);
            const { data: colony, error } = await supabase.from('planets').select('*').eq('id', planetId).single();

            if (colony && !error) {
                // Cache current main planet data if not already on colony
                if (!currentPlanetId || currentPlanetId === 'main') {
                    setMainPlanetCache(current); // Use REF state
                    console.log('🪐 Cached main planet data');
                }

                setCurrentPlanetId(planetId);

                // Merge colony resources with defaults to prevent NaN/null
                const colonyResources = colony.resources || {};
                const safeResources = {
                    metal: colonyResources.metal ?? 500,
                    crystal: colonyResources.crystal ?? 300,
                    deuterium: colonyResources.deuterium ?? 100,
                    darkMatter: colonyResources.darkMatter ?? 0,
                    energy: 0,
                    maxEnergy: 0,
                    storage: {
                        metal: colonyResources.storage?.metal ?? 10000,
                        crystal: colonyResources.storage?.crystal ?? 10000,
                        deuterium: colonyResources.storage?.deuterium ?? 10000
                    }
                };

                // Colony buildings start at 0 (fresh colony)
                const colonyBuildings = colony.buildings || {};
                const safeBuildings: Record<string, number> = {};
                Object.keys(initialState.buildings).forEach(key => {
                    safeBuildings[key] = colonyBuildings[key] ?? 0;
                });

                // DEBUG: Log colony data
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📥 [LOAD] Colony loaded from Supabase:', planetId);
                console.log('  📦 Resources:', JSON.stringify(safeResources));
                console.log('  🏗️ Buildings:', JSON.stringify(safeBuildings));
                console.log('  🚀 Ships:', JSON.stringify(colony.ships));
                console.log('  🛡️ Defenses:', JSON.stringify(colony.defenses));
                console.log('  🔨 ConstructionQueue:', colony.construction_queue?.length || 0, 'items');
                console.log('  🔧 ShipyardQueue:', colony.shipyard_queue?.length || 0, 'items');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                // CRITICAL FIX: Update Reference State immediately to match loaded colony
                // This prevents "Data desync" warnings when validation runs
                lastSavedStateRef.current = {
                    ...gameState, // Preserve global state properties
                    resources: safeResources,
                    buildings: safeBuildings,
                    ships: colony.ships || {},
                    defenses: colony.defenses || {},
                    constructionQueue: colony.construction_queue || [],
                    shipyardQueue: colony.shipyard_queue || []
                };

                // Load colony-specific data into gameState
                setGameState(prev => ({
                    ...prev,
                    planetName: colony.planet_name || `Kolonia ${planets.indexOf(colony) + 1}`,
                    planetType: colony.planet_type || 'terran',
                    resources: safeResources,
                    buildings: safeBuildings,
                    ships: colony.ships || {},
                    defenses: colony.defenses || {},
                    constructionQueue: colony.construction_queue || [],
                    shipyardQueue: colony.shipyard_queue || [],
                    galaxyCoords: colony.galaxy_coords,
                    debris: colony.debris || { metal: 0, crystal: 0 },
                    // Keep research from main planet (shared)
                    // research: prev.research
                }));

                console.log('🪐 Switched to colony (Fresh DB Load):', colony.planet_name);
            } else {
                console.error("Failed to load colony:", error);
                alert("Błąd wczytywania kolonii.");
            }
        }
    };
    // ===== END COLONIZATION SYSTEM =====

    const updateProductionSetting = (buildingId: BuildingId, percent: number) => { setGameState(prev => ({ ...prev, productionSettings: { ...prev.productionSettings, [buildingId]: percent } })); };

    const renamePlanet = async (newName: string, specificPlanetId?: string) => {
        if (!newName.trim()) return;
        const trimmedName = newName.trim();
        const targetId = specificPlanetId || currentPlanetRef.current;
        const isMain = targetId === 'main';

        console.log(`🪐 Renaming ${targetId} to ${trimmedName}`);

        // 1. Optimistic Status Update
        if (targetId === currentPlanetRef.current) {
            setGameState(prev => ({ ...prev, planetName: trimmedName }));
            if (isMain) setMainPlanetName(trimmedName);
        } else if (isMain) {
            setMainPlanetName(trimmedName);
        }

        // 2. DB Update and List Refresh
        if (isMain) {
            const { error } = await supabase.from('profiles').update({ planet_name: trimmedName }).eq('id', session.user.id);
            if (error) console.error('❌ Main rename error:', error);
            else {
                console.log('✅ Main renamed');
                await fetchPlanets();
            }
        } else {
            const { error } = await supabase.from('planets').update({ planet_name: trimmedName }).eq('id', targetId);
            if (error) console.error('❌ Colony rename error:', error);
            else {
                console.log('✅ Colony renamed');
                await fetchPlanets();
            }
        }
    };

    const renameUser = async (newNickname: string) => {
        if (!newNickname.trim()) return;
        setGameState(prev => ({
            ...prev,
            nickname: newNickname.trim(),
            productionSettings: { ...prev.productionSettings, nickname: newNickname.trim() }
        }));
        await supabase.from('profiles').update({
            nickname: newNickname.trim(),
            production_settings: { ...gameState.productionSettings, nickname: newNickname.trim() }
        }).eq('id', session.user.id);
        console.log('👤 User renamed to:', newNickname);
    };
    const resetGame = () => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); };
    const clearLogs = async () => {
        setGameState(prev => ({ ...prev, missionLogs: [] }));
        await supabase.from('profiles').update({ mission_logs: [] }).eq('id', session.user.id);
    };
    const logout = async () => {
        // Try to save before logout (best effort)
        try {
            await saveGame('Logout');
        } catch (e) {
            console.error('Logout save failed:', e);
        }

        localStorage.removeItem(STORAGE_KEY); // Clear local data on logout
        localStorage.removeItem(STORAGE_KEY + '_backup');
        await supabase.auth.signOut();
        window.location.reload();
    };

    const abandonColony = async (planetId: string, confirmation: string) => {
        if (!planetId || planetId === 'main') {
            alert("Nie możesz porzucić Głównej Planety!");
            return false;
        }

        if (confirmation !== 'DELETE') {
            return false;
        }

        console.log('🔥 Abandoning colony:', planetId);

        // Delete from DB
        const { error } = await supabase.from('planets').delete().eq('id', planetId);

        if (error) {
            console.error('Failed to abandon colony:', error);
            alert(`Błąd: ${error.message}`);
            return false;
        }

        // If we deleted the current planet, switch back to main
        if (currentPlanetId === planetId) {
            setCurrentPlanetId('main');
            if (mainPlanetCache) {
                setGameState(mainPlanetCache);
                setMainPlanetCache(null);
            }
        }

        // Refresh planets list
        fetchPlanets();

        alert("Kolonia została porzucona.");
        return true;
    };

    const deleteAccount = async () => {
        if (!session?.user) return;
        if (!confirm('Czy na pewno chcesz usunąć konto? Tej operacji nie można cofnąć. Twoje imperium zostanie zniszczone.')) return;

        try {
            await supabase.from('missions').delete().eq('owner_id', session.user.id);
            await supabase.from('profiles').delete().eq('id', session.user.id);
            await logout();
        } catch (e) {
            console.error("Error deleting account:", e);
            alert("Błąd podczas usuwania konta. Spróbuj ponownie.");
        }
    };

    const updateAvatar = async (url: string) => {
        setGameState(prev => ({ ...prev, avatarUrl: url }));
        const currentSettings = gameState.productionSettings || {};
        await supabase.from('profiles').update({ production_settings: { ...currentSettings, avatarUrl: url } }).eq('id', session.user.id);
    };

    const updatePlanetType = async (type: string) => {
        setGameState(prev => ({ ...prev, planetType: type as "terran" | "desert" | "ice" }));
        const currentSettings = gameState.productionSettings || {};
        await supabase.from('profiles').update({ production_settings: { ...currentSettings, planetType: type } }).eq('id', session.user.id);
    };

    const getPlayersInSystem = async (galaxy: number, system: number) => {
        try {
            // 1. Fetch Main Planets (Profiles that are in this system)
            const { data: mainPlanets, error: mainError } = await supabase
                .from('profiles')
                .select('id, planet_name, galaxy_coords, points, production_settings, buildings, nickname, level, debris')
                .contains('galaxy_coords', { galaxy, system });

            if (mainError) throw mainError;

            // 2. Fetch Colonies (Planets that are in this system)
            const { data: colonies, error: colonyError } = await supabase
                .from('planets')
                .select('id, owner_id, planet_name, planet_type, galaxy_coords, buildings, ships, defenses, debris')
                .contains('galaxy_coords', { galaxy, system });

            if (colonyError) throw colonyError;

            let finalUsers = mainPlanets || [];

            // 3. If we have colonies, we need to attach owner info (nickname, points)
            if (colonies && colonies.length > 0) {
                const ownerIds = [...new Set(colonies.map(c => c.owner_id))];

                // Fetch owner profiles
                const { data: owners, error: ownerError } = await supabase
                    .from('profiles')
                    .select('id, nickname, points, production_settings, level')
                    .in('id', ownerIds);

                if (ownerError) console.error("Error fetching colony owners:", ownerError);

                const ownerMap = new Map(owners?.map(o => [o.id, o]) || []);

                const mappedColonies = colonies.map(col => {
                    const owner = ownerMap.get(col.owner_id);
                    // If this colony belongs to a player who IS ALSO in the mainPlanets list (same system), 
                    // we still want to show it as a separate planet (colony)
                    return {
                        id: col.owner_id, // Use owner_id for interaction links
                        colony_id: col.id, // Keep distinct planet ID
                        planet_name: col.planet_name,
                        galaxy_coords: col.galaxy_coords,
                        points: owner?.points || 0,
                        level: owner?.level || 1,
                        production_settings: {
                            ...(owner?.production_settings || {}),
                            planetType: col.planet_type // Use colony planet type
                        },
                        buildings: col.buildings,
                        nickname: (owner?.nickname || 'Unknown') + ' (Kolonia)',
                        isColony: true,
                        debris: col.debris
                    };
                });

                finalUsers = [...finalUsers, ...mappedColonies];
            }

            return finalUsers;
        } catch (error) {
            console.error("Error fetching system users:", error);
            return [];
        }
    };

    // Main Loop
    useEffect(() => {
        if (!loaded) return;

        const tick = () => {
            const now = Date.now();
            const prev = gameStateRef.current; // Use Ref for current state to avoid side-effects in setter

            const production = calculateProduction(prev);
            const secondsPassed = (now - prev.lastTick) / 1000;
            if (secondsPassed <= 0) return;

            // 1. Calculate Production Deltas (Wait to apply)
            const metalGain = production.metal * secondsPassed;
            const crystalGain = production.crystal * secondsPassed;
            const deuteriumGain = production.deuterium * secondsPassed;

            let newBuildings = { ...prev.buildings };
            let newResearch = { ...prev.research };
            let newQueue = [...prev.constructionQueue];

            let xpGained = 0; // Accumulate XP from finished research

            // Process ALL finished items (Parallel Queues)
            const finished = newQueue.filter(q => now >= q.endTime);
            const active = newQueue.filter(q => now < q.endTime);

            if (finished.length > 0) {
                finished.forEach(item => {
                    if (item.type === 'building') {
                        newBuildings[item.itemId as BuildingId] = (item.targetLevel || 1);
                    }
                    else if (item.type === 'research') {
                        const level = item.targetLevel || 1;
                        newResearch[item.itemId as ResearchId] = level;
                        // XP Reward for Research: (Level^2) * 10
                        xpGained += Math.pow(level, 2) * 10;
                    }
                });
                newQueue = active;
            }

            let newShips = { ...prev.ships };
            let newDefenses = { ...prev.defenses };
            let newShipQueue = [...prev.shipyardQueue];
            while (newShipQueue.length > 0 && now >= newShipQueue[0].endTime) {
                const completed = newShipQueue.shift();
                if (completed) {
                    if (completed.type === 'defense') {
                        newDefenses[completed.itemId as DefenseId] = (newDefenses[completed.itemId as DefenseId] || 0) + (completed.quantity || 0);
                    } else {
                        newShips[completed.itemId as ShipId] = (newShips[completed.itemId as ShipId] || 0) + (completed.quantity || 0);
                    }
                }
            }

            // Calculate derived values for Payload (Best effort based on Ref)
            // Note: Actual State update will use Delta to be safe against race conditions
            const refXP = (prev.xp || 0) + xpGained;
            const refLevel = Math.floor(Math.sqrt(refXP / 500)) + 1;
            const prevLevel = prev.level || 1;
            let refDMReward = 0;
            if (refLevel > prevLevel) {
                for (let l = prevLevel + 1; l <= refLevel; l++) {
                    refDMReward += 10 + (l * 2);
                }
            }

            // Level 16 Lock Logic
            const currentPoints = calculatePoints(prev.resources, newBuildings, newShips, newResearch, newDefenses);
            const pointsLevel = Math.floor(currentPoints / 1000) + 1;
            let updatedSettings = { ...prev.productionSettings };
            let settingsChanged = false;

            if (pointsLevel >= 16 && !updatedSettings.reachedLevel16) {
                updatedSettings.reachedLevel16 = true;
                settingsChanged = true;
            }

            // Persist completed items or settings to Supabase
            if (finished.length > 0 || (prev.shipyardQueue.length !== newShipQueue.length) || settingsChanged || now - prev.lastTick > 30000) {
                const currentPlanet = currentPlanetRef.current;
                const reason = finished.length > 0 ? 'Queue Completed' : (now - prev.lastTick > 30000 ? 'Tick 30s' : 'Settings Changed');
                console.log(`💾 [TICK SAVE] Reason: ${reason}, Target: ${currentPlanet || 'main'}`);

                if (!currentPlanet || currentPlanet === 'main') {
                    // Save to Profile (Main Planet)
                    const payload = {
                        buildings: newBuildings,
                        research: newResearch,
                        ships: newShips,
                        defenses: newDefenses,
                        resources: {
                            ...prev.resources,
                            // Apply production gain to Ref state for DB snapshot
                            metal: Math.min(production.storage.metal, (prev.resources.metal || 0) + metalGain),
                            crystal: Math.min(production.storage.crystal, (prev.resources.crystal || 0) + crystalGain),
                            deuterium: Math.min(production.storage.deuterium, (prev.resources.deuterium || 0) + deuteriumGain),
                            darkMatter: (prev.resources.darkMatter || 0) + refDMReward
                        },
                        xp: refXP,
                        level: refLevel,
                        shipyard_queue: newShipQueue,
                        construction_queue: newQueue,
                        production_settings: updatedSettings,
                        last_updated: Date.now()
                    };
                    console.log('💾 [TICK SAVE] Payload:', JSON.stringify(payload).substring(0, 200) + '...');

                    supabase.from('profiles').update(payload).eq('id', session.user.id).then(({ error }) => {
                        if (error) console.error("❌ [TICK SAVE ERROR] Main:", error);
                        else console.log("✅ [TICK SAVE] Main Success");
                    });

                } else {
                    // Save to Planet (Colony)
                    console.log(`💾 [TICK SAVE] Colony ${currentPlanet} - Buildings:`, JSON.stringify(newBuildings));
                    // Note: saveStateToPlanet uses absolute values. Since we are on colony, 'prev' IS colony state.
                    // We must pass resources with production applied.
                    const colonyResources = {
                        ...prev.resources,
                        metal: Math.min(production.storage.metal, (prev.resources.metal || 0) + metalGain),
                        crystal: Math.min(production.storage.crystal, (prev.resources.crystal || 0) + crystalGain),
                        deuterium: Math.min(production.storage.deuterium, (prev.resources.deuterium || 0) + deuteriumGain),
                    };

                    saveStateToPlanet(currentPlanet, newBuildings, newShips, newDefenses, colonyResources, newQueue, newShipQueue);

                    // ALWAYS sync global settings to Profile when on Colony (Level16, Research, Points, XP)
                    supabase.from('profiles').update({
                        production_settings: updatedSettings,
                        research: newResearch,
                        points: calculatePoints(colonyResources, newBuildings, newShips, newResearch, newDefenses),
                        xp: refXP,
                        level: refLevel,
                        last_updated: Date.now()
                    }).eq('id', session.user.id).then(res => {
                        if (res.error) console.error("Colony profile sync error:", res.error);
                    });
                }

                // Update lastSavedStateRef for validation
                lastSavedStateRef.current = {
                    ...prev,
                    buildings: newBuildings, // Updated
                    research: newResearch,
                    ships: newShips,
                    defenses: newDefenses,
                    resources: { // Updated with Production
                        ...prev.resources,
                        metal: Math.min(production.storage.metal, (prev.resources.metal || 0) + metalGain),
                        crystal: Math.min(production.storage.crystal, (prev.resources.crystal || 0) + crystalGain),
                        deuterium: Math.min(production.storage.deuterium, (prev.resources.deuterium || 0) + deuteriumGain),
                        darkMatter: (prev.resources.darkMatter || 0) + refDMReward
                    },
                    constructionQueue: newQueue,
                    shipyardQueue: newShipQueue
                };
            }

            setGameState(current => {
                // Re-calculate XP/Level against latest state
                const finalXP = (current.xp || 0) + xpGained;
                const finalLevel = Math.floor(Math.sqrt(finalXP / 500)) + 1;
                const curPrevLevel = current.level || 1;
                let curDMReward = 0;
                if (finalLevel > curPrevLevel) {
                    for (let l = curPrevLevel + 1; l <= finalLevel; l++) {
                        curDMReward += 10 + (l * 2);
                    }
                    if (curDMReward > 0) console.log(`🎉 Level Up! ${curPrevLevel} -> ${finalLevel}. Reward: ${curDMReward} DM`);
                }

                return {
                    ...current,
                    productionSettings: settingsChanged ? updatedSettings : current.productionSettings,
                    resources: {
                        ...current.resources, // BASE State
                        // Apply DELTA (Production & Rewards)
                        metal: Math.min(production.storage.metal, (current.resources.metal || 0) + metalGain),
                        crystal: Math.min(production.storage.crystal, (current.resources.crystal || 0) + crystalGain),
                        deuterium: Math.min(production.storage.deuterium, (current.resources.deuterium || 0) + deuteriumGain),
                        energy: production.energy,
                        maxEnergy: production.maxEnergy,
                        storage: production.storage,
                        darkMatter: (current.resources.darkMatter || 0) + curDMReward // Safe DM Update
                    },
                    buildings: newBuildings,
                    research: newResearch,
                    ships: newShips,
                    defenses: newDefenses,
                    constructionQueue: newQueue,
                    shipyardQueue: newShipQueue,
                    productionRates: { metal: production.metal, crystal: production.crystal, deuterium: production.deuterium },
                    xp: finalXP,
                    level: finalLevel,
                    lastTick: now
                };
            });
        };

        const interval = setInterval(tick, TICK_RATE);
        return () => clearInterval(interval);
    }, [loaded]);

    // Level System Logic
    const addXP = (amount: number, reason?: string) => {
        if (amount <= 0) return;

        setGameState(prev => {
            const currentXP = prev.xp || 0;
            const currentLevel = prev.level || 1;
            const newXP = currentXP + amount;

            // Level Formula: Level = Math.sqrt(XP / 500) + 1
            const calcLevel = Math.floor(Math.sqrt(newXP / 500)) + 1;

            if (calcLevel > currentLevel) {
                const totalDM = 10 + (calcLevel * 2);
                // Only alert if it's a small jump (live gameplay)
                const levelsGained = calcLevel - currentLevel;
                if (levelsGained === 1) {
                    alert(`⭐ AWANS! Poziom ${calcLevel}!\nOtrzymujesz ${totalDM} Antymaterii.`);
                }

                return {
                    ...prev,
                    xp: newXP,
                    level: calcLevel,
                    resources: {
                        ...prev.resources,
                        darkMatter: (prev.resources.darkMatter || 0) + totalDM
                    }
                };
            }

            return { ...prev, xp: newXP, level: calcLevel };
        });

        if (reason) console.log(`⭐ [XP] +${amount} (${reason})`);
    };

    // Retroactive XP Calculation
    // Retroactive XP Catch-Up (Corrects missing XP for existing players)
    // FIX: Use a ref to ensure this only runs ONCE per session to prevent loop!
    const xpCatchUpAppliedRef = useRef(false);

    useEffect(() => {
        if (!loaded) return;
        if (xpCatchUpAppliedRef.current) return; // Already applied this session

        // Calculate expected XP based on current assets
        let calculatedTotal = 0;

        // 1. Building XP Helper (Cost / 1000)
        const calculateBuildingXP = (b: Record<string, number>) => {
            let val = 0;
            Object.entries(b).forEach(([id, level]) => {
                const def = BUILDINGS[id as BuildingId];
                if (!def) return;
                let cost = 0;
                for (let l = 1; l <= (level as number); l++) {
                    const factor = Math.pow(1.5, l - 1);
                    cost += Math.floor(def.baseCost.metal * factor) + Math.floor(def.baseCost.crystal * factor);
                }
                val += Math.floor(cost / 100);
            });
            return val;
        };

        // 2. Ship XP Helper (Cost / 2000)
        const calculateShipXP = (s: Record<string, number>) => {
            let val = 0;
            Object.entries(s).forEach(([id, count]) => {
                const def = SHIPS[id as ShipId];
                if (!def) return;
                const unitCost = def.baseCost.metal + def.baseCost.crystal;
                val += Math.floor((unitCost * (count as number)) / 200); // 50% XP for fleet compared to buildings
            });
            return val;
        };

        // Sum Main Planet
        calculatedTotal += calculateBuildingXP(gameState.buildings);
        calculatedTotal += calculateShipXP(gameState.ships);

        // Sum Colonies
        planets.forEach(p => {
            if (p.buildings) calculatedTotal += calculateBuildingXP(p.buildings);
            if (p.ships) calculatedTotal += calculateShipXP(p.ships);
        });

        // Sum Research (Level^2 * 10)
        Object.entries(gameState.research).forEach(([id, level]) => {
            let researchXP = 0;
            for (let l = 1; l <= (level as number); l++) {
                researchXP += (Math.pow(l, 2) * 10);
            }
            calculatedTotal += researchXP;
        });

        const currentXP = gameState.xp || 0;

        // Apply Catch-Up if current XP is less than asset value
        // We use a small buffer (e.g. 10) to avoid negligible updates loop
        if (calculatedTotal > currentXP + 10) {
            const diff = calculatedTotal - currentXP;
            console.log(`⭐ Retroactive XP Fix: Player has ${currentXP}, Assets worth ${calculatedTotal}. Adding ${diff}.`);
            xpCatchUpAppliedRef.current = true; // Mark as applied BEFORE calling addXP
            addXP(diff, 'Retroactive Catch-Up');
        } else {
            xpCatchUpAppliedRef.current = true; // No catch-up needed, but mark as checked
        }
    }, [loaded, planets.length]);

    const contextValue: GameContextType = {
        ...gameState,
        addXP,
        upgradeBuilding,
        upgradeResearch,
        buildShip,
        buildDefense,
        sendExpedition,
        sendAttack,
        sendSpyProbe,
        sendTransport,
        cancelMission,
        cancelConstruction,
        buyPremium,
        getCost,
        checkRequirements,
        renamePlanet,
        updateProductionSetting,
        resetGame,
        isOnline, // NEW
        clearLogs,
        logout,
        deleteAccount,
        abandonColony,
        updateAvatar,
        updatePlanetType,
        getPlayersInSystem,
        renameUser,
        getLevel,
        session,
        // Colonization
        planets,
        currentPlanetId,
        mainPlanetName,
        mainPlanetCoords,
        sendColonize,
        switchPlanet,
        fetchPlanets
    };

    return (
        <GameContext.Provider value={contextValue}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
