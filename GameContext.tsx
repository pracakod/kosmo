import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from './lib/supabase';
import { calculateExpeditionOutcome } from './lib/gameLogic';
import { GameState, BuildingId, ResearchId, ShipId, DefenseId, ConstructionItem, Requirement, FleetMission, MissionType, MissionLog, MissionRewards } from './types';
import { BUILDINGS, RESEARCH, SHIPS, DEFENSES } from './constants';

const generatePvPBattleResult = (attackerShips: any, defenderShips: any, defenderDefenses: any, defenderBuildings: any, defenderResearch: any, defenderResources: any, isBot = false) => {
    let attackPower = 0;
    let defensePower = 0;

    Object.entries(attackerShips).forEach(([id, count]) => {
        const ship = SHIPS[id as ShipId];
        if (ship) attackPower += (ship.attack * (count as number));
    });

    // Defender Power (Ships + Defenses)
    let defenderDefense = 0;
    let defenderAttack = 0;

    if (defenderShips) {
        Object.entries(defenderShips).forEach(([id, count]) => {
            const ship = SHIPS[id as ShipId];
            if (ship) {
                defenderDefense += (ship.defense * (count as number));
                defenderAttack += (ship.attack * (count as number));
            }
        });
    }

    if (defenderDefenses) {
        Object.entries(defenderDefenses).forEach(([id, count]) => {
            const defense = DEFENSES[id as DefenseId];
            if (defense) {
                defenderDefense += (defense.defense * (count as number));
                defenderAttack += (defense.attack * (count as number));
            }
        });
    }

    // Bot Boost
    if (isBot) {
        defenderDefense = Math.max(100, attackPower * 0.8);
        defenderAttack = Math.max(100, attackPower * 0.5);
    }

    const attackerWin = attackPower > defenderDefense;

    // Calculate Losses
    // Simplified: Loser loses 50-100% of fleet, Winner loses 10-30%
    const attackerLossRatio = attackerWin ? 0.2 : 0.8;
    const defenderLossRatio = attackerWin ? 0.8 : 0.1;

    const survivingAttackerShips: any = {};
    const attackerLosses: any = {};
    let totalAttackerLost = 0;
    Object.entries(attackerShips).forEach(([id, count]) => {
        const lost = Math.floor((count as number) * (attackerLossRatio + (Math.random() * 0.2)));
        const survived = (count as number) - lost;
        if (survived > 0) survivingAttackerShips[id] = survived;
        attackerLosses[id] = lost;
        totalAttackerLost += lost;
    });

    const survivingDefenderShips: any = {};
    const defenderLosses: any = {};
    if (defenderShips) {
        Object.entries(defenderShips).forEach(([id, count]) => {
            const lost = Math.floor((count as number) * (defenderLossRatio + (Math.random() * 0.2)));
            const survived = (count as number) - lost;
            if (survived > 0) survivingDefenderShips[id] = survived;
            defenderLosses[id] = lost;
        });
    }

    const survivingDefenderDefenses: any = {};
    const defenderDefensesLost: any = {};
    if (defenderDefenses) {
        Object.entries(defenderDefenses).forEach(([id, count]) => {
            const lost = Math.floor((count as number) * (defenderLossRatio + (Math.random() * 0.2)));
            const repaired = Math.floor(lost * 0.7);
            const actuallyLost = lost - repaired;

            const survived = (count as number) - actuallyLost;
            if (survived > 0) survivingDefenderDefenses[id] = survived;
            defenderDefensesLost[id] = actuallyLost;
        });
    }

    // Loot
    let loot = { metal: 0, crystal: 0, deuterium: 0 };
    if (attackerWin) {
        // Take 50% of available resources
        loot.metal = Math.floor((defenderResources.metal || 0) * 0.5);
        loot.crystal = Math.floor((defenderResources.crystal || 0) * 0.5);
        loot.deuterium = Math.floor((defenderResources.deuterium || 0) * 0.5);
    }

    // Building Damage (only if attacker wins - 10% chance per building to lose 1 level)
    const damagedBuildings: Record<string, number> = {};
    if (attackerWin && defenderBuildings) {
        Object.entries(defenderBuildings).forEach(([id, level]) => {
            const lvl = level as number;
            if (lvl > 0 && Math.random() < 0.10) { // 10% chance
                damagedBuildings[id] = 1; // Lose 1 level
            }
        });
    }

    return {
        survivingAttackerShips,
        survivingDefenderShips,
        survivingDefenderDefenses,
        attackerLosses,
        defenderLosses,
        defenderDefensesLost,
        damagedBuildings, // New: buildings that lost levels
        loot,
        result: attackerWin ? 'attacker_win' : 'defender_win',
        rounds: 6, // Simulation placeholder
        log: {
            id: Date.now().toString(),
            timestamp: Date.now(),
            title: attackerWin ? "Zwycięstwo!" : "Porażka!",
            message: `Walka zakończona.Wynik: ${attackerWin ? 'Wygrana' : 'Przegrana'}.Straty: ${totalAttackerLost} jednostek.Zrabowano: M:${loot.metal} C:${loot.crystal} `,
            outcome: (attackerWin ? 'success' : 'failure') as 'success' | 'failure'
        },
        attackerWon: attackerWin
    };
};

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
    buyPremium: (cost: number, reward: { metal?: number, crystal?: number, deuterium?: number }) => TransactionStatus;
    getCost: (type: 'building' | 'research', id: string, currentLevel: number) => { metal: number, crystal: number, deuterium: number };
    checkRequirements: (reqs?: Requirement[]) => boolean;
    renamePlanet: (newName: string) => void;
    updateProductionSetting: (buildingId: BuildingId, percent: number) => void;
    resetGame: () => void;
    clearLogs: () => void;
    logout: () => void;
    deleteAccount: () => Promise<void>;

    updateAvatar: (url: string) => void;
    updatePlanetType: (type: string) => void;
    getPlayersInSystem: (galaxy: number, system: number) => Promise<any[]>;
    renameUser: (name: string) => void;
    getLevel: (points: number, settings?: any) => number;
    session?: any;

    // Colonization
    planets: any[];
    currentPlanetId: string | null;
    sendColonize: (coords: { galaxy: number, system: number, position: number }, resources: { metal: number, crystal: number, deuterium: number }) => Promise<boolean>;
    switchPlanet: (planetId: string) => void;
    fetchPlanets: () => Promise<void>;
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
};

const calculatePoints = (resources: any, buildings: any, ships: any) => {
    const r = resources || {};
    const resPoints = Math.floor(((Number(r.metal) || 0) + (Number(r.crystal) || 0) + (Number(r.deuterium) || 0)) / 1000);
    const buildPoints = Object.values(buildings || {}).reduce((acc: number, val: any) => acc + (Number(val) || 0) * 100, 0);
    const shipPoints = Object.values(ships || {}).reduce((acc: number, val: any) => acc + (Number(val) || 0) * 50, 0);
    return Math.floor(Number(resPoints) + Number(buildPoints) + Number(shipPoints));
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode, session: any }> = ({ children, session }) => {
    const [gameState, setGameState] = useState<GameState>({ ...initialState, userId: session?.user.id });
    const [loaded, setLoaded] = useState(false);
    const [isSyncPaused, setIsSyncPaused] = useState(false); // Circuit breaker for Auth errors
    const [planets, setPlanets] = useState<any[]>([]);
    const [currentPlanetId, setCurrentPlanetId] = useState<string | null>(null);
    const [mainPlanetCache, setMainPlanetCache] = useState<GameState | null>(null); // Cache main planet data when switching to colony
    const gameStateRef = useRef(gameState);

    // Keep ref synchronized
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Debug version
    useEffect(() => {
        console.log('🚀 GameContext v2.1 (Hotfix) LOADED - Auto-Save Circuit Breaker Active');
    }, []);

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

            const myMissions = mappedMissions.filter(m => m.ownerId === session.user.id && m.status !== 'completed');
            let incoming = mappedMissions.filter(m => m.targetUserId === session.user.id && m.ownerId !== session.user.id && m.status === 'flying');

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
            setGameState(prev => ({
                ...prev,
                planetName: data.planet_name || prev.planetName,
                nickname: data.nickname || prev.nickname || 'Player',
                resources: { ...prev.resources, ...loadedResources },
                buildings: { ...prev.buildings, ...data.buildings },
                research: { ...prev.research, ...data.research },
                ships: { ...prev.ships, ...data.ships },
                defenses: { ...prev.defenses, ...data.defenses },
                constructionQueue: data.construction_queue || [],
                shipyardQueue: data.shipyard_queue || [],
                productionSettings: { ...prev.productionSettings, ...data.production_settings },
                avatarUrl: data.production_settings?.avatarUrl || prev.avatarUrl || initialState.avatarUrl,
                planetType: data.production_settings?.planetType || prev.planetType || (['terran', 'desert', 'ice'][Math.floor(Math.random() * 3)]),
                missionLogs: data.mission_logs || [],
                galaxyCoords: data.galaxy_coords,
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
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, [session]);

    // Auto-save loop (Interval instead of debounce to prevent starvation by ticks)
    useEffect(() => {
        if (!loaded || !session?.user || isSyncPaused) return;

        const save = async () => {
            if (isSyncPaused) return;
            const current = gameStateRef.current;

            // Save to LocalStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));

            // Save to Supabase
            const { error } = await supabase.from('profiles').upsert({
                id: session.user.id,
                planet_name: current.planetName,
                // nickname removed from root level, stored in production_settings
                resources: current.resources,
                buildings: current.buildings,
                research: current.research,
                ships: current.ships,
                defenses: current.defenses,
                construction_queue: current.constructionQueue,
                shipyard_queue: current.shipyardQueue,
                production_settings: { ...current.productionSettings, avatarUrl: current.avatarUrl, planetType: current.planetType, nickname: current.nickname }, // Save nickname in production_settings for legacy/consistency
                active_missions: current.activeMissions,
                mission_logs: current.missionLogs,
                galaxy_coords: current.galaxyCoords,
                points: calculatePoints(current.resources, current.buildings, current.ships),
                last_updated: Date.now()
            });

            if (error) {
                if (error.code === '401' || error.code === '403' || error.message.includes('JWT')) {
                    console.error("🛑 AUTO-SAVE DISABLED: 401 Unauthorized. Stopping loop.");
                    setIsSyncPaused(true);
                } else {
                    console.error("Save error:", error.message);
                }
            }
        };

        const interval = setInterval(save, 60000); // Save every 60 seconds (optimized for DB limits)

        // Save on unmount / refresh
        const handleBeforeUnload = () => {
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
    const processMissionArrival = async (mission: FleetMission) => {
        if (mission.eventProcessed) return;

        let result: any = {};
        let loot: MissionRewards = {};
        let survivingAttacker = { ...mission.ships };

        try {
            console.log('Processing Arrival:', mission.id, mission.type);

            if (mission.type === MissionType.EXPEDITION) {
                const expeditionResult = calculateExpeditionOutcome(mission);
                result = expeditionResult.log;

                // Add resources/ships from expedition to return cargo
                if (expeditionResult.rewards) loot = expeditionResult.rewards;

            } else if (mission.type === MissionType.ATTACK) {
                if (mission.targetUserId) {
                    // Fetch target data
                    const { data: targetProfile, error: targetError } = await supabase.from('profiles').select('*').eq('id', mission.targetUserId).single();

                    if (targetError) throw new Error(`Target profile fetch error: ${targetError.message} `);


                    if (targetProfile) {
                        const battle = generatePvPBattleResult(
                            mission.ships,
                            targetProfile.ships,
                            targetProfile.defenses || {}, // Pass defenses
                            targetProfile.buildings,
                            targetProfile.research,
                            targetProfile.resources
                        );

                        result = {
                            id: `${mission.id} -result`, // Deterministic ID to avoid duplicates
                            timestamp: Date.now(),
                            title: battle.result === 'attacker_win' ? 'Zwycięstwo!' : 'Porażka',
                            message: `Walka zakończona.Wynik: ${battle.result === 'attacker_win' ? 'Wygrana' : 'Przegrana'}.Straty: ${Object.values(battle.attackerLosses).reduce((a: number, b: number) => a + b, 0)} jednostek.Zrabowano: M:${Math.floor(battle.loot.metal)} C:${Math.floor(battle.loot.crystal)} `,
                            outcome: battle.result === 'attacker_win' ? 'success' : 'failure',
                            rewards: { metal: battle.loot.metal, crystal: battle.loot.crystal, deuterium: battle.loot.deuterium },
                            report: {
                                rounds: battle.rounds,
                                attackerLosses: battle.attackerLosses,
                                defenderLosses: battle.defenderLosses,
                                defenderDefensesLost: battle.defenderDefensesLost,
                                finalAttackerShips: battle.survivingAttackerShips,
                                finalDefenderShips: battle.survivingDefenderShips,
                                finalDefenderDefenses: battle.survivingDefenderDefenses,
                                loot: battle.loot
                            }
                        };

                        loot = battle.loot;
                        survivingAttacker = battle.survivingAttackerShips;
                        const survivingDefender = battle.survivingDefenderShips;
                        const survivingDefenses = battle.survivingDefenderDefenses;

                        // Update Defender (Apply damage) only if timestamp check allows (idempotency check improved by DB constraint but here logic helps too)
                        // Note: For duplicate log prevention on defender side, we use a deterministic ID logic or check existing
                        const newTargetLogs = [
                            {
                                id: `${mission.id} -def - log`, // Deterministic ID
                                timestamp: Date.now(),
                                title: "ZOSTAŁEŚ ZAATAKOWANY!",
                                message: `Gracz ${gameStateRef.current.nickname || 'Nieznany'} [${mission.originCoords.galaxy}: ${mission.originCoords.system}: ${mission.originCoords.position}] zaatakował Cię.\nFlota: ${Object.entries(mission.ships).map(([id, n]) => `${SHIPS[id as ShipId]?.name || id}: ${n}`).join(', ')}.\nWynik: ${battle.result === 'attacker_win' ? 'PORAŻKA (Planeta splądrowana)' : 'ZWYCIĘSTWO (Atak odparty)'}.\nZrabowano: M:${Math.floor(battle.loot.metal).toLocaleString()} C:${Math.floor(battle.loot.crystal).toLocaleString()} D:${Math.floor(battle.loot.deuterium).toLocaleString()}.\nStraty Agresora: ${Object.entries(battle.attackerLosses || {}).filter(([, v]) => (v as number) > 0).map(([id, n]) => `${SHIPS[id as ShipId]?.name || id}: ${n}`).join(', ') || 'Brak'}.\nTwoje Straty (Flota): ${Object.entries(battle.defenderLosses || {}).filter(([, v]) => (v as number) > 0).map(([id, n]) => `${SHIPS[id as ShipId]?.name || id}: ${n}`).join(', ') || 'Brak'}.\nTwoje Straty (Obrona): ${Object.entries(battle.defenderDefensesLost || {}).filter(([, v]) => (v as number) > 0).map(([id, n]) => `${DEFENSES[id as DefenseId]?.name || id}: ${n}`).join(', ') || 'Brak'}.\nUszkodzone Budynki: ${Object.entries(battle.damagedBuildings || {}).filter(([, v]) => (v as number) > 0).map(([id, n]) => `${BUILDINGS[id as BuildingId]?.name || id}: -${n} lvl`).join(', ') || 'Brak'}.`,
                                outcome: 'danger' as 'danger',
                                report: {
                                    rounds: battle.rounds,
                                    attackerLosses: battle.attackerLosses,
                                    defenderLosses: battle.defenderLosses,
                                    defenderDefensesLost: battle.defenderDefensesLost,
                                    finalAttackerShips: battle.survivingAttackerShips,
                                    finalDefenderShips: battle.survivingDefenderShips,
                                    finalDefenderDefenses: battle.survivingDefenderDefenses,
                                    loot: battle.loot
                                }
                            },
                            ...(targetProfile.mission_logs || [])
                        ].filter((log, index, self) => index === self.findIndex(t => t.id === log.id)).slice(0, 50);

                        // Apply building damage
                        const newBuildings = { ...targetProfile.buildings };
                        Object.entries(battle.damagedBuildings || {}).forEach(([buildingId, damage]) => {
                            if (newBuildings[buildingId] !== undefined) {
                                newBuildings[buildingId] = Math.max(0, newBuildings[buildingId] - (damage as number));
                            }
                        });

                        await supabase.from('profiles').update({
                            ships: survivingDefender,
                            defenses: survivingDefenses, // Update defenses
                            buildings: newBuildings, // Apply building damage
                            resources: {
                                ...targetProfile.resources,
                                metal: Math.max(0, targetProfile.resources.metal - (loot.metal || 0)),
                                crystal: Math.max(0, targetProfile.resources.crystal - (loot.crystal || 0)),
                                deuterium: Math.max(0, targetProfile.resources.deuterium - (loot.deuterium || 0))
                            },
                            mission_logs: newTargetLogs
                        }).eq('id', mission.targetUserId);
                    }
                } else {
                    // PvE (Pirates)
                    const battle = generatePvPBattleResult(mission.ships, {}, {}, {}, {}, { metal: 5000, crystal: 3000, deuterium: 500 } as any, true);
                    result = {
                        id: `${mission.id} -pve - result`,
                        timestamp: Date.now(),
                        title: 'Bitwa z Piratami',
                        message: battle.log.message,
                        outcome: 'success',
                        rewards: { metal: battle.loot.metal, crystal: battle.loot.crystal, deuterium: battle.loot.deuterium },
                        report: {
                            rounds: battle.rounds,
                            attackerLosses: battle.attackerLosses,
                            defenderLosses: battle.defenderLosses,
                            defenderDefensesLost: battle.defenderDefensesLost,
                            finalAttackerShips: battle.survivingAttackerShips,
                            finalDefenderShips: battle.survivingDefenderShips,
                            finalDefenderDefenses: battle.survivingDefenderDefenses,
                            loot: battle.loot
                        }
                    };
                    loot = battle.loot;
                    survivingAttacker = battle.survivingAttackerShips;
                }
            } else if (mission.type === MissionType.SPY) {
                if (mission.targetUserId) {
                    const { data: targetProfile } = await supabase.from('profiles').select('*').eq('id', mission.targetUserId).single();
                    if (targetProfile) {
                        // Espionage Logic
                        const attackerSpyLevel = gameStateRef.current.research[ResearchId.ESPIONAGE_TECH] || 0;
                        const defenderSpyLevel = targetProfile.research?.[ResearchId.ESPIONAGE_TECH] || 0;
                        const spyDiff = attackerSpyLevel - defenderSpyLevel;

                        // Base Info: Resources (always visible if spy successful, maybe chance based later)
                        let spyMessage = `Cel: ${targetProfile.nickname || 'Nieznany'} [${mission.targetCoords.galaxy}: ${mission.targetCoords.system}: ${mission.targetCoords.position}].\n`;
                        spyMessage += `Zasoby: M:${Math.floor(targetProfile.resources?.metal || 0).toLocaleString()} C:${Math.floor(targetProfile.resources?.crystal || 0).toLocaleString()} D:${Math.floor(targetProfile.resources?.deuterium || 0).toLocaleString()} \n`;

                        // Details based on Tech Difference
                        // Level Difference >= 2: Show Fleet
                        if (spyDiff >= 2 || attackerSpyLevel >= 4) { // Allow brute force with high level
                            const sh = targetProfile.ships || {};
                            const shipList = Object.entries(sh).map(([id, count]) => `${SHIPS[id as ShipId]?.name || id}: ${count} `).join(', ');
                            spyMessage += `Flota: ${shipList || 'Brak'} \n`;
                        } else {
                            spyMessage += `Flota: (Wymagany wyższy poziom szpiegostwa) \n`;
                        }

                        // Level Difference >= 3: Show Defense
                        if (spyDiff >= 3 || attackerSpyLevel >= 6) {
                            const def = targetProfile.defenses || {};
                            const defList = Object.entries(def).map(([id, count]) => `${DEFENSES[id as DefenseId]?.name || id}: ${count} `).join(', ');
                            spyMessage += `Obrona: ${defList || 'Brak'} \n`;
                        } else {
                            spyMessage += `Obrona: (Wymagany wyższy poziom szpiegostwa) \n`;
                        }

                        // Level Difference >= 4: Show Buildings
                        if (spyDiff >= 4 || attackerSpyLevel >= 8) {
                            const bld = targetProfile.buildings || {};
                            const bldList = Object.entries(bld).map(([id, lvl]) => `${BUILDINGS[id as BuildingId]?.name || id} (${lvl})`).join(', ');
                            spyMessage += `Budynki: ${bldList || 'Brak'} \n`;
                        } else {
                            spyMessage += `Budynki: (Wymagany wyższy poziom szpiegostwa) \n`;
                        }

                        result = {
                            id: Date.now().toString(),
                            timestamp: Date.now(),
                            outcome: 'success' as 'success',
                            title: 'Raport Szpiegowski',
                            message: spyMessage
                        };

                        const newTargetLogs = [
                            {
                                id: Date.now().toString(),
                                timestamp: Date.now(),
                                title: "Wykryto Skanowanie!",
                                message: `Gracz ${gameStateRef.current.nickname || 'Nieznany'} [${mission.originCoords.galaxy}: ${mission.originCoords.system}: ${mission.originCoords.position}] przeskanował Twoją planetę.`,
                                outcome: 'danger' as 'danger'
                            },
                            ...(targetProfile.mission_logs || [])
                        ].slice(0, 50);

                        await supabase.from('profiles').update({ mission_logs: newTargetLogs }).eq('id', mission.targetUserId);
                    }
                } else {
                    result = { id: Date.now().toString(), timestamp: Date.now(), outcome: 'success' as 'success', title: 'Raport', message: 'Opuszczona planeta. Brak oznak życia.' };
                }
            } else if (mission.type === MissionType.TRANSPORT) {
                if (mission.targetUserId) {
                    const { data: targetProfile } = await supabase.from('profiles').select('*').eq('id', mission.targetUserId).single();
                    if (targetProfile) {
                        const newRes = {
                            metal: (targetProfile.resources?.metal || 0) + (mission.resources?.metal || 0),
                            crystal: (targetProfile.resources?.crystal || 0) + (mission.resources?.crystal || 0),
                            deuterium: (targetProfile.resources?.deuterium || 0) + (mission.resources?.deuterium || 0),
                        };

                        const newTargetLogs = [
                            { id: Date.now().toString(), timestamp: Date.now(), title: "Dostawa Surowców", message: `Gracz ${session.user.email?.split('@')[0]} dostarczył: M:${mission.resources?.metal} C:${mission.resources?.crystal} D:${mission.resources?.deuterium} `, outcome: 'success' as 'success' },
                            ...(targetProfile.mission_logs || [])
                        ].slice(0, 50);

                        await supabase.from('profiles').update({ resources: newRes, mission_logs: newTargetLogs }).eq('id', mission.targetUserId);

                        result = {
                            id: Date.now().toString(),
                            timestamp: Date.now(),
                            outcome: 'success' as 'success',
                            title: 'Transport',
                            message: `Surowce dostarczone do gracza ${targetProfile.nickname || targetProfile.email || 'Nieznany'} [${mission.targetCoords.galaxy}: ${mission.targetCoords.system}: ${mission.targetCoords.position}].`
                        };
                    }
                } else {
                    result = { id: Date.now().toString(), timestamp: Date.now(), outcome: 'neutral' as 'neutral', title: 'Transport', message: 'Nie znaleziono kolonii docelowej. Flota zawraca.' };
                    loot = mission.resources || {};
                }
            }

            // Update Mission in DB (Start Return)
            const duration = (mission.returnTime - mission.startTime) / 2; // Approximate way home

            await supabase.from('missions').update({
                status: 'returning',
                resources: loot, // Attacker carries this
                ships: survivingAttacker,
                result: result,
                return_time: Date.now() + duration
            }).eq('id', mission.id);

            // Refresh local state
            fetchMissions();

        } catch (err: any) {
            console.error('Critical Error in processMissionArrival:', err);
            alert(`BŁĄD PRZYLOTU: ${err.message || err} `);
        }
    };

    // Process Mission Return (Home reached)
    const processMissionReturn = async (localMission: FleetMission) => {
        try {
            console.log('Processing Return:', localMission.id);
            // Fetch fresh mission data to ensure we have the latest result/resources from DB
            const { data: missionData } = await supabase.from('missions').select('*').eq('id', localMission.id).single();

            // Fallback to local if fetch fails (shouldn't happen) but prefer DB data
            const mission = missionData ? {
                ...localMission,
                resources: missionData.resources,
                result: missionData.result,
                ships: missionData.ships || localMission.ships, // CRITICAL: Use DB ships (contains battle losses)
                type: missionData.mission_type as MissionType,
                startTime: missionData.start_time,
                returnTime: missionData.return_time
            } : localMission;

            const { data: myProfile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

            if (error) throw new Error(`Profile fetch error: ${error.message} `);
            if (!myProfile) return;

            const newShips = { ...myProfile.ships };
            if (mission.ships) {
                Object.entries(mission.ships).forEach(([id, count]) => {
                    // Ensure we are adding numbers, even if DB returns strings
                    const currentVal = Number(newShips[id]) || 0;
                    const valToAdd = Number(count) || 0;
                    newShips[id] = currentVal + valToAdd;
                });
            }

            const newRes = { ...myProfile.resources };
            if (mission.resources) {
                newRes.metal = (Number(newRes.metal) || 0) + (Number(mission.resources.metal) || 0);
                newRes.crystal = (Number(newRes.crystal) || 0) + (Number(mission.resources.crystal) || 0);
                newRes.deuterium = (Number(newRes.deuterium) || 0) + (Number(mission.resources.deuterium) || 0);
                newRes.darkMatter = (Number(newRes.darkMatter) || 0) + (Number(mission.resources.darkMatter) || 0);

                // Add found ships (Expedition Rewards)
                if (mission.resources.ships) {
                    Object.entries(mission.resources.ships).forEach(([id, count]) => {
                        const currentVal = Number(newShips[id]) || 0;
                        const valToAdd = Number(count) || 0;
                        newShips[id] = currentVal + valToAdd;
                    });
                }
            }

            const title = mission.result?.title || `Powrót Floty`;
            const message = mission.result?.message || `Flota wróciła z misji ${mission.type}.`;
            const outcome = (mission.result?.outcome as 'success' | 'failure' | 'neutral' | 'danger') || 'success';

            const newLogs = [
                { id: Date.now().toString(), timestamp: Date.now(), title, message, outcome, rewards: mission.resources },
                ...(myProfile.mission_logs || [])
            ].slice(0, 50);

            // Robust update
            const { error: updateError } = await supabase.from('profiles').update({
                ships: newShips,
                resources: newRes,
                mission_logs: newLogs,
                points: calculatePoints(newRes, gameState.buildings, newShips)
            }).eq('id', session.user.id);

            if (updateError) throw new Error(`Profile Update Failed: ${updateError.message} `);

            // Update Local State immediately to prevent race condition with Autosaver
            setGameState(prev => ({
                ...prev,
                ships: newShips,
                resources: newRes,
                missionLogs: newLogs
            }));

            // Mark completed
            await supabase.from('missions').update({ status: 'completed' }).eq('id', mission.id);
            await refreshProfile(); // Refresh resources & ships
            fetchMissions();

        } catch (err: any) {
            console.error('Critical Error in processMissionReturn:', err);
            // Temporary debug alert
            alert(`BŁĄD MISJI: ${err.message || err} `);
        }
    };



    // Subscribe to DB changes
    useEffect(() => {
        if (!session?.user) return;
        fetchMissions();

        const channel = supabase
            .channel('missions-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, () => {
                fetchMissions();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [session]);



    // Mission Processing Watcher
    useEffect(() => {
        if (!loaded || !session?.user) return;
        let pollCounter = 0;

        const checkMissions = async () => {
            const now = Date.now();
            // Access state via ref to avoid dependency loop
            const missions = gameStateRef.current.activeMissions;

            // Poll for incoming attacks every 30 seconds (backup for Realtime)
            pollCounter++;
            if (pollCounter >= 30) {
                pollCounter = 0;
                fetchMissions(); // Refresh both active and incoming missions
            }

            // Check Arrivals (OWNER processes normally, TARGET processes if stuck > 10s)
            const arriving = missions.filter(m =>
                m.status === 'flying' &&
                now >= m.arrivalTime &&
                !m.eventProcessed &&
                (m.ownerId === session.user.id || (m.targetUserId === session.user.id && now > m.arrivalTime + 10000))
            );

            for (const m of arriving) {
                // Mark processed locally to prevent race in loop
                setGameState(prev => ({ ...prev, activeMissions: prev.activeMissions.map(am => am.id === m.id ? { ...am, eventProcessed: true } : am) }));
                await processMissionArrival(m);
            }

            // Check Returns
            const returning = missions.filter(m => m.status === 'returning' && now >= m.returnTime && m.ownerId === session.user.id);
            for (const m of returning) {
                // Mark processed
                setGameState(prev => ({ ...prev, activeMissions: prev.activeMissions.filter(am => am.id !== m.id) })); // Optimistic remove
                await processMissionReturn(m);
            }
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
    const buyPremium = (cost: number, reward: { metal?: number, crystal?: number, deuterium?: number }): TransactionStatus => {
        if (gameState.resources.darkMatter < cost) return 'no_funds';
        if (reward.metal && (gameState.resources.metal + reward.metal > gameState.resources.storage.metal)) return 'storage_full';
        if (reward.crystal && (gameState.resources.crystal + reward.crystal > gameState.resources.storage.crystal)) return 'storage_full';
        if (reward.deuterium && (gameState.resources.deuterium + reward.deuterium > gameState.resources.storage.deuterium)) return 'storage_full';

        setGameState(prev => ({
            ...prev,
            resources: {
                ...prev.resources,
                darkMatter: prev.resources.darkMatter - cost,
                metal: Math.min(prev.resources.storage.metal, prev.resources.metal + (reward.metal || 0)),
                crystal: Math.min(prev.resources.storage.crystal, prev.resources.crystal + (reward.crystal || 0)),
                deuterium: Math.min(prev.resources.storage.deuterium, prev.resources.deuterium + (reward.deuterium || 0)),
            }
        }));
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
            fetchMissions(); // Revert optimistic update
            refreshProfile(); // Revert ships
            return;
        }

        // Update Profile (Deduct Ships)
        const currentShips = { ...gameState.ships };
        Object.entries(ships).forEach(([id, count]) => {
            currentShips[id as ShipId] = (currentShips[id as ShipId] || 0) - count;
        });

        await supabase.from('profiles').update({
            ships: currentShips,
            points: calculatePoints(gameState.resources, gameState.buildings, currentShips)
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

        // Optimistic
        const mission: FleetMission = {
            id: missionId,
            ownerId: session?.user.id,
            type: MissionType.ATTACK,
            ships: ships,
            targetCoords: coords,
            targetUserId: targetUserId,
            originCoords: gameState.galaxyCoords || { galaxy: 1, system: 1, position: 1 },
            startTime: now,
            arrivalTime: now + duration, // Duration is ONE WAY flight time
            returnTime: now + (duration * 2), // Round trip = 2x one-way
            eventProcessed: false,
            status: 'flying'
        };

        setGameState(prev => {
            const newShips = { ...prev.ships };
            Object.entries(ships).forEach(([id, count]) => { newShips[id as ShipId] -= count; });
            return { ...prev, ships: newShips, activeMissions: [...prev.activeMissions, mission] };
        });

        // DB Insert
        const { data: insertedData, error: insertError } = await supabase.from('missions').insert({
            id: missionId,
            owner_id: session.user.id,
            target_user_id: targetUserId,
            mission_type: MissionType.ATTACK,
            ships: ships,
            target_coords: coords,
            origin_coords: gameState.galaxyCoords || { galaxy: 1, system: 1, position: 1 },
            start_time: now,
            arrival_time: now + duration, // ONE WAY
            return_time: now + (duration * 2), // Round trip
            status: 'flying'
        }).select();

        if (insertError) {
            console.error('❌ ATTACK INSERT ERROR:', insertError);
            alert("Błąd wysyłania ataku.");
            fetchMissions();
            refreshProfile();
            return;
        }

        if (insertError) {
            console.error('❌ ATTACK INSERT ERROR:', insertError);
        } else {
            console.log('✅ ATTACK INSERTED:', insertedData);

            // Update Profile (Deduct Ships)
            const currentShips = { ...gameState.ships };
            Object.entries(ships).forEach(([id, count]) => {
                currentShips[id as ShipId] = (currentShips[id as ShipId] || 0) - count;
            });
            await supabase.from('profiles').update({
                ships: currentShips,
                points: calculatePoints(gameState.resources, gameState.buildings, currentShips)
            }).eq('id', session.user.id);
        }
    };

    const sendSpyProbe = async (amount: number, coords: { galaxy: number, system: number, position: number }) => {
        if ((gameState.ships[ShipId.ESPIONAGE_PROBE] || 0) < amount) return false;

        const now = Date.now();
        const duration = 30 * 1000; // 30 seconds for spy probe

        const missionId = crypto.randomUUID();
        const targetUserId = await findTargetUser(coords);

        // Optimistic update
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
            ships: { ...prev.ships, [ShipId.ESPIONAGE_PROBE]: prev.ships[ShipId.ESPIONAGE_PROBE] - amount },
            activeMissions: [...prev.activeMissions, mission]
        }));

        // DB Insert
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
            alert("Błąd wysyłania sondy.");
            fetchMissions();
            refreshProfile();
            return false;
        }

        // Update Profile (Deduct Probes)
        const currentShips = { ...gameState.ships };
        currentShips[ShipId.ESPIONAGE_PROBE] = (currentShips[ShipId.ESPIONAGE_PROBE] || 0) - amount;
        await supabase.from('profiles').update({
            ships: currentShips,
            points: calculatePoints(gameState.resources, gameState.buildings, currentShips)
        }).eq('id', session.user.id);

        return true;
    };

    const sendTransport = async (ships: Record<ShipId, number>, resources: MissionRewards, coords: { galaxy: number, system: number, position: number }) => {
        const duration = 5 * 60 * 1000; // 5 minutes fixed
        const now = Date.now();
        const missionId = crypto.randomUUID();
        const targetUserId = await findTargetUser(coords);

        // Optimistic update
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

        setGameState(prev => {
            const newShips = { ...prev.ships };
            Object.entries(ships).forEach(([id, count]) => { newShips[id as ShipId] = (newShips[id as ShipId] || 0) - count; });
            return {
                ...prev,
                ships: newShips,
                resources: {
                    ...prev.resources,
                    metal: prev.resources.metal - (resources.metal || 0),
                    crystal: prev.resources.crystal - (resources.crystal || 0),
                    deuterium: prev.resources.deuterium - (resources.deuterium || 0)
                },
                activeMissions: [...prev.activeMissions, mission]
            };
        });

        // DB Insert
        const { error } = await supabase.from('missions').insert({
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

        if (error) {
            console.error("Error sending transport:", error);
            alert("Błąd wysyłania transportu.");
            fetchMissions();
            refreshProfile();
            return;
        }

        if (error) console.error("Error sending transport:", error);
        else {
            // Update Profile (Deduct Ships & Resources)
            const currentShips = { ...gameState.ships };
            Object.entries(ships).forEach(([id, count]) => {
                currentShips[id as ShipId] = (currentShips[id as ShipId] || 0) - count;
            });
            const currentRes = { ...gameState.resources };
            currentRes.metal -= (resources.metal || 0);
            currentRes.crystal -= (resources.crystal || 0);
            currentRes.deuterium -= (resources.deuterium || 0);

            await supabase.from('profiles').update({
                ships: currentShips,
                resources: currentRes,
                points: calculatePoints(currentRes, gameState.buildings, currentShips)
            }).eq('id', session.user.id);
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
            fetchMissions();
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

        const newResources = {
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
            refreshProfile(); // Revert
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

        // Sync with Supabase
        try {
            const { error } = await supabase.from('profiles').update({
                resources: newResources,
                construction_queue: newQueue
            }).eq('id', session.user.id);

            if (error) throw error;
        } catch (error) {
            console.error("Cancel constr sync failed:", error);
            refreshProfile(); // Revert on failure
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

        setGameState(prev => ({
            ...prev,
            resources: {
                ...prev.resources,
                metal: prev.resources.metal - cost.metal,
                crystal: prev.resources.crystal - cost.crystal,
                deuterium: prev.resources.deuterium - cost.deuterium
            },
            constructionQueue: [...prev.constructionQueue, {
                id: now.toString(),
                type: 'research',
                itemId: researchId,
                targetLevel: currentLevel + 1,
                startTime: now,
                endTime: now + buildTime
            }]
        }));

        await supabase.from('profiles').update({
            resources: {
                ...gameState.resources,
                metal: gameState.resources.metal - cost.metal,
                crystal: gameState.resources.crystal - cost.crystal,
                deuterium: gameState.resources.deuterium - cost.deuterium
            },
            construction_queue: [...gameState.constructionQueue, {
                id: now.toString(),
                type: 'research',
                itemId: researchId,
                targetLevel: currentLevel + 1,
                startTime: now,
                endTime: now + buildTime
            }]
        }).eq('id', session.user.id);
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

        await supabase.from('profiles').update({
            resources: { ...gameState.resources, metal: gameState.resources.metal - totalCost.metal, crystal: gameState.resources.crystal - totalCost.crystal, deuterium: gameState.resources.deuterium - totalCost.deuterium },
            shipyard_queue: newQueue
        }).eq('id', session.user.id);
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

        await supabase.from('profiles').update({
            resources: { ...gameState.resources, metal: gameState.resources.metal - totalCost.metal, crystal: gameState.resources.crystal - totalCost.crystal, deuterium: gameState.resources.deuterium - totalCost.deuterium },
            shipyard_queue: newQueue
        }).eq('id', session.user.id);
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

        // Check resources
        if (gameState.resources.metal < resources.metal ||
            gameState.resources.crystal < resources.crystal ||
            gameState.resources.deuterium < resources.deuterium) {
            alert('Brak wystarczających zasobów!');
            return false;
        }

        // Deduct colony ship and resources
        const newShips = { ...gameState.ships, [ShipId.COLONY_SHIP]: (gameState.ships[ShipId.COLONY_SHIP] || 0) - 1 };
        const newResources = {
            ...gameState.resources,
            metal: gameState.resources.metal - resources.metal,
            crystal: gameState.resources.crystal - resources.crystal,
            deuterium: gameState.resources.deuterium - resources.deuterium
        };

        setGameState(prev => ({
            ...prev,
            ships: newShips,
            resources: newResources
        }));

        // Create the new planet with starting resources
        console.log('🌍 Creating planet at:', coords, 'with resources:', resources);
        const { data: insertedPlanet, error } = await supabase.from('planets').insert({
            owner_id: session.user.id,
            planet_name: `Kolonia ${planets.length + 1}`,
            planet_type: 'terran',
            galaxy_coords: coords,
            resources: {
                metal: 500 + resources.metal,
                crystal: 300 + resources.crystal,
                deuterium: 100 + resources.deuterium,
                darkMatter: 0,
                energy: 0,
                maxEnergy: 0,
                storage: { metal: 10000, crystal: 10000, deuterium: 10000 }
            },
            buildings: {},
            ships: {},
            defenses: {},
            is_main: false
        }).select();

        console.log('🌍 Planet insert result:', { insertedPlanet, error });

        if (error) {
            console.error('❌ Colonization failed:', error);
            alert(`Błąd kolonizacji: ${error.message}\n\nSprawdź czy tabela 'planets' istnieje w Supabase i ma poprawne RLS!`);
            // Revert ship deduction
            setGameState(prev => ({
                ...prev,
                ships: { ...prev.ships, [ShipId.COLONY_SHIP]: (prev.ships[ShipId.COLONY_SHIP] || 0) + 1 },
                resources: {
                    ...prev.resources,
                    metal: prev.resources.metal + resources.metal,
                    crystal: prev.resources.crystal + resources.crystal,
                    deuterium: prev.resources.deuterium + resources.deuterium
                }
            }));
            return false;
        }

        // Update profile with new ships and resources
        await supabase.from('profiles').update({
            ships: newShips,
            resources: newResources
        }).eq('id', session.user.id);

        // Add log
        const newLog = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            title: 'Nowa Kolonia!',
            message: `Założono nową kolonię w [${coords.galaxy}:${coords.system}:${coords.position}]. Wysłano M:${resources.metal} C:${resources.crystal} D:${resources.deuterium}.`,
            outcome: 'success' as 'success'
        };
        setGameState(prev => ({
            ...prev,
            missionLogs: [newLog, ...prev.missionLogs].slice(0, 50)
        }));

        // Refresh planets
        await fetchPlanets();
        return true;
    };

    const switchPlanet = async (planetId: string) => {
        console.log('🪐 Switching to planet:', planetId);

        if (planetId === 'main') {
            // Switch back to main planet - restore from cache if available
            setCurrentPlanetId('main');

            if (mainPlanetCache) {
                // Restore from cache
                setGameState(mainPlanetCache);
                setMainPlanetCache(null);
                console.log('🪐 Restored main planet from cache');
            } else {
                // Fallback: reload from DB
                await refreshProfile();
                console.log('🪐 Reloaded main planet from DB (no cache)');
            }
        } else {
            // Find the colony in planets array
            const colony = planets.find(p => p.id === planetId);
            if (colony) {
                // Cache current main planet data if not already on colony
                if (!currentPlanetId || currentPlanetId === 'main') {
                    setMainPlanetCache({ ...gameState });
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

                // Load colony-specific data into gameState
                setGameState(prev => ({
                    ...prev,
                    planetName: colony.planet_name || `Kolonia ${planets.indexOf(colony) + 1}`,
                    planetType: colony.planet_type || 'terran',
                    resources: safeResources,
                    buildings: safeBuildings,
                    ships: colony.ships || {},
                    defenses: colony.defenses || {},
                    galaxyCoords: colony.galaxy_coords,
                    // Keep research from main planet (shared)
                    // research: prev.research
                }));

                console.log('🪐 Switched to colony:', colony.planet_name, 'Resources:', safeResources);
            }
        }
    };
    // ===== END COLONIZATION SYSTEM =====

    const updateProductionSetting = (buildingId: BuildingId, percent: number) => { setGameState(prev => ({ ...prev, productionSettings: { ...prev.productionSettings, [buildingId]: percent } })); };

    const renamePlanet = async (newName: string) => {
        if (!newName.trim()) return;
        setGameState(prev => ({ ...prev, planetName: newName.trim() }));
        await supabase.from('profiles').update({ planet_name: newName.trim() }).eq('id', session.user.id);
        console.log('🪐 Planet renamed to:', newName);
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
        localStorage.removeItem(STORAGE_KEY); // Clear local data on logout
        await supabase.auth.signOut();
        window.location.reload();
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
        const { data, error } = await supabase
            .from('profiles')
            .select('id, planet_name, galaxy_coords, points, production_settings, buildings, nickname')
            .contains('galaxy_coords', { galaxy, system });

        if (error) {
            console.error("Error fetching system users:", error);
            return [];
        }
        return data || [];
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

            const newResources = { ...prev.resources };
            newResources.metal = Math.min(newResources.storage.metal, newResources.metal + (production.metal * secondsPassed));
            newResources.crystal = Math.min(newResources.storage.crystal, newResources.crystal + (production.crystal * secondsPassed));
            newResources.deuterium = Math.min(newResources.storage.deuterium, newResources.deuterium + (production.deuterium * secondsPassed));
            newResources.energy = production.energy;
            newResources.maxEnergy = production.maxEnergy;
            newResources.storage = production.storage;

            let newBuildings = { ...prev.buildings };
            let newResearch = { ...prev.research };
            let newQueue = [...prev.constructionQueue];

            // Process ALL finished items (Parallel Queues)
            const finished = newQueue.filter(q => now >= q.endTime);
            const active = newQueue.filter(q => now < q.endTime);

            if (finished.length > 0) {
                finished.forEach(item => {
                    if (item.type === 'building') newBuildings[item.itemId as BuildingId] = (item.targetLevel || 1);
                    else if (item.type === 'research') newResearch[item.itemId as ResearchId] = (item.targetLevel || 1);
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

            // Level 16 Lock Logic
            const currentPoints = calculatePoints(newResources, newBuildings, newShips);
            const currentLevel = Math.floor(currentPoints / 1000) + 1;
            let updatedSettings = { ...prev.productionSettings };
            let settingsChanged = false;

            if (currentLevel >= 16 && !updatedSettings.reachedLevel16) {
                updatedSettings.reachedLevel16 = true;
                settingsChanged = true;
            }

            // Persist completed items or settings to Supabase
            if (finished.length > 0 || (prev.shipyardQueue.length !== newShipQueue.length) || settingsChanged) {
                supabase.from('profiles').update({
                    buildings: newBuildings,
                    research: newResearch,
                    ships: newShips,
                    defenses: newDefenses,
                    shipyard_queue: newShipQueue,
                    construction_queue: newQueue,
                    production_settings: settingsChanged ? updatedSettings : updatedSettings, // Correctly save settings
                    points: currentPoints
                }).eq('id', session.user.id).then(({ error }) => {
                    if (error) console.error("Auto-save error:", error);
                });
            }

            setGameState(current => ({
                ...current,
                productionSettings: settingsChanged ? updatedSettings : current.productionSettings,
                resources: {
                    ...newResources,
                    storage: production.storage
                },
                buildings: newBuildings,
                research: newResearch,
                ships: newShips,
                defenses: newDefenses,
                constructionQueue: newQueue,
                shipyardQueue: newShipQueue,
                productionRates: { metal: production.metal, crystal: production.crystal, deuterium: production.deuterium },
                lastTick: now
            }));
        };

        const interval = setInterval(tick, TICK_RATE);
        return () => clearInterval(interval);
    }, [loaded]);

    const contextValue: GameContextType = {
        ...gameState,
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
        clearLogs,
        logout,
        deleteAccount,
        updateAvatar,
        updatePlanetType,
        getPlayersInSystem,
        renameUser,
        getLevel,
        session,
        // Colonization
        planets,
        currentPlanetId,
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
