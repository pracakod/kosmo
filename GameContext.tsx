
import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from './lib/supabase';
import { calculateExpeditionOutcome } from './lib/gameLogic';
import { GameState, BuildingId, ResearchId, ShipId, ConstructionItem, Requirement, FleetMission, MissionType, MissionLog, MissionRewards } from './types';
import { BUILDINGS, RESEARCH, SHIPS } from './constants';

const generatePvPBattleResult = (attackerShips: any, defenderShips: any, defenderBuildings: any, defenderResearch: any, defenderResources: any, isBot = false) => {
    let attackPower = 0;
    let defensePower = 0;

    Object.entries(attackerShips).forEach(([id, count]) => {
        const ship = SHIPS[id as ShipId];
        if (ship) attackPower += (ship.attack * (count as number));
    });

    // Defender Ships
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
    let totalAttackerLost = 0;
    Object.entries(attackerShips).forEach(([id, count]) => {
        const lost = Math.floor((count as number) * (attackerLossRatio + (Math.random() * 0.2)));
        const survived = (count as number) - lost;
        if (survived > 0) survivingAttackerShips[id] = survived;
        totalAttackerLost += lost;
    });

    const survivingDefenderShips: any = {};
    if (defenderShips) {
        Object.entries(defenderShips).forEach(([id, count]) => {
            const lost = Math.floor((count as number) * (defenderLossRatio + (Math.random() * 0.2)));
            const survived = (count as number) - lost;
            if (survived > 0) survivingDefenderShips[id] = survived;
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

    return {
        survivingAttackerShips,
        survivingDefenderShips,
        loot,
        log: {
            id: Date.now().toString(),
            timestamp: Date.now(),
            title: attackerWin ? "Zwycięstwo!" : "Porażka!",
            message: `Walka zakończona. Wynik: ${attackerWin ? 'Wygrana' : 'Przegrana'}. Straty: ${totalAttackerLost} jednostek. Zrabowano: M:${loot.metal} C:${loot.crystal}`,
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
    sendExpedition: (ships: Record<ShipId, number>, coords: { galaxy: number, system: number, position: number }) => void;
    sendAttack: (ships: Record<ShipId, number>, coords: { galaxy: number, system: number, position: number }) => void;
    sendTransport: (ships: Record<ShipId, number>, resources: { metal: number, crystal: number, deuterium: number }, coords: { galaxy: number, system: number, position: number }) => void;
    cancelMission: (missionId: string) => Promise<void>;
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
    getPlayersInSystem: (galaxy: number, system: number) => Promise<any[]>;
    renameUser: (name: string) => void;
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
        [ResearchId.COMBUSTION_DRIVE]: 2,
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
    return Math.floor(resPoints + buildPoints + shipPoints);
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode, session: any }> = ({ children, session }) => {
    const [gameState, setGameState] = useState<GameState>({ ...initialState, userId: session?.user.id });
    const [loaded, setLoaded] = useState(false);
    const [isSyncPaused, setIsSyncPaused] = useState(false); // Circuit breaker for Auth errors
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
            .or(`owner_id.eq.${session.user.id},target_user_id.eq.${session.user.id}`);

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
            const incoming = mappedMissions.filter(m => m.targetUserId === session.user.id && m.ownerId !== session.user.id && m.status === 'flying');

            if (incoming.length > 0) console.log('Incoming Attacks Detected:', incoming);

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
            // Merge loaded data
            setGameState(prev => ({
                ...prev,
                planetName: data.planet_name || prev.planetName,
                nickname: data.nickname || prev.nickname || 'Player', // Load nickname
                resources: { ...prev.resources, ...data.resources },
                buildings: { ...prev.buildings, ...data.buildings },
                research: { ...prev.research, ...data.research },
                ships: { ...prev.ships, ...data.ships },
                constructionQueue: data.construction_queue || [],
                shipyardQueue: data.shipyard_queue || [],
                productionSettings: { ...prev.productionSettings, ...data.production_settings },
                avatarUrl: data.production_settings?.avatarUrl || prev.avatarUrl || initialState.avatarUrl,
                planetType: data.production_settings?.planetType || prev.planetType || (['terran', 'desert', 'ice'][Math.floor(Math.random() * 3)]),
                // Don't overwrite activeMissions from profile (legacy), we use missions table now
                missionLogs: data.mission_logs || [],
                galaxyCoords: data.galaxy_coords,
                lastTick: Date.now()
            }));
        } else {
            if (error && (error.code === '401' || error.code === '403')) {
                console.error("🛑 PROFILE LOAD FLOP: RLS Policy Missing");
                setIsSyncPaused(true);
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
    useEffect(() => {
        refreshProfile();
        fetchMissions();
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

                    if (targetError) throw new Error(`Target profile fetch error: ${targetError.message}`);

                    if (targetProfile) {
                        const battle = generatePvPBattleResult(
                            mission.ships,
                            targetProfile.ships,
                            targetProfile.buildings,
                            targetProfile.research,
                            targetProfile.resources
                        );

                        result = battle.log;
                        loot = battle.loot;
                        survivingAttacker = battle.survivingAttackerShips;
                        const survivingDefender = battle.survivingDefenderShips;

                        // Update Defender (Apply damage)
                        const newTargetLogs = [
                            { id: Date.now().toString(), timestamp: Date.now(), title: "ZOSTAŁEŚ ZAATAKOWANY!", message: `Gracz ${session.user.email?.split('@')[0]} zaatakował Cię.\n${battle.log.message}`, outcome: 'danger' as 'danger' },
                            ...(targetProfile.mission_logs || [])
                        ].slice(0, 50);

                        await supabase.from('profiles').update({
                            ships: survivingDefender,
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
                    const battle = generatePvPBattleResult(mission.ships, {}, {}, {}, { metal: 5000, crystal: 3000, deuterium: 500 } as any, true);
                    result = battle.log;
                    loot = battle.loot;
                    survivingAttacker = battle.survivingAttackerShips;
                }
            } else if (mission.type === MissionType.SPY) {
                if (mission.targetUserId) {
                    const { data: targetProfile } = await supabase.from('profiles').select('*').eq('id', mission.targetUserId).single();
                    if (targetProfile) {
                        result = {
                            id: Date.now().toString(),
                            timestamp: Date.now(),
                            outcome: 'success' as 'success',
                            title: 'Raport Szpiegowski',
                            message: `Skan planety [${mission.targetCoords.galaxy}:${mission.targetCoords.system}:${mission.targetCoords.position}].\nZasoby: M:${Math.floor(targetProfile.resources?.metal || 0)} C:${Math.floor(targetProfile.resources?.crystal || 0)} D:${Math.floor(targetProfile.resources?.deuterium || 0)}\nBudynki: (Ukryte przez technologię szpiegowską level 0)\nFlota: ${Object.keys(targetProfile.ships || {}).length > 0 ? 'Wykryto sygnatury floty' : 'Brak floty'}.`
                        };

                        const newTargetLogs = [
                            { id: Date.now().toString(), timestamp: Date.now(), title: "Wykryto Skanowanie!", message: `Obca sonda przeskanowała Twoją planetę.`, outcome: 'danger' as 'danger' },
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
                            { id: Date.now().toString(), timestamp: Date.now(), title: "Dostawa Surowców", message: `Gracz dostarczył: M:${mission.resources?.metal} C:${mission.resources?.crystal} D:${mission.resources?.deuterium}`, outcome: 'success' as 'success' },
                            ...(targetProfile.mission_logs || [])
                        ].slice(0, 50);

                        await supabase.from('profiles').update({ resources: newRes, mission_logs: newTargetLogs }).eq('id', mission.targetUserId);
                        result = { id: Date.now().toString(), timestamp: Date.now(), outcome: 'success' as 'success', title: 'Transport', message: 'Surowce dostarczone.' };
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

        } catch (err) {
            console.error('Critical Error in processMissionArrival:', err);
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
                type: missionData.mission_type as MissionType
            } : localMission;

            const { data: myProfile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

            if (error) throw new Error(`Profile fetch error: ${error.message}`);
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
                mission_logs: newLogs
            }).eq('id', session.user.id);

            if (updateError) throw new Error(`Profile Update Failed: ${updateError.message}`);

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

        } catch (err) {
            console.error('Critical Error in processMissionReturn:', err);
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
            const missions = gameState.activeMissions;

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
    }, [gameState.activeMissions, loaded, session]);
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
        await supabase.from('missions').insert({
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
        } else {
            console.log('✅ ATTACK INSERTED:', insertedData);
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
        await supabase.from('missions').insert({
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
            active_mission: true,
            target_coords: coords,
            origin_coords: gameState.galaxyCoords || { galaxy: 1, system: 1, position: 1 },
            start_time: now,
            arrival_time: now + (duration / 2),
            return_time: now + duration,
            status: 'flying'
        });

        if (error) console.error("Error sending transport:", error);
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
        await supabase.from('missions').update({
            status: 'returning',
            return_time: newReturnTime,
            arrival_time: now
        }).eq('id', missionId);
    };

    // Upgrades
    const upgradeBuilding = (buildingId: BuildingId) => {
        const currentLevel = gameState.buildings[buildingId];
        const cost = getCost('building', buildingId, currentLevel);
        if (gameState.resources.metal < cost.metal || gameState.resources.crystal < cost.crystal || gameState.resources.deuterium < cost.deuterium) return;
        if (gameState.constructionQueue.length > 0) return;

        const totalResources = cost.metal + cost.crystal;
        let buildTimeMs = (totalResources / 2500) * 3600 * 1000;
        buildTimeMs = buildTimeMs / (gameState.buildings[BuildingId.ROBOT_FACTORY] + 1);
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
            constructionQueue: [{
                id: now.toString(),
                type: 'building',
                itemId: buildingId,
                targetLevel: currentLevel + 1,
                startTime: now,
                endTime: now + buildTime
            }]
        }));
    };

    const upgradeResearch = (researchId: ResearchId) => {
        const currentLevel = gameState.research[researchId];
        const cost = getCost('research', researchId, currentLevel);
        if (gameState.resources.metal < cost.metal || gameState.resources.crystal < cost.crystal || gameState.resources.deuterium < cost.deuterium) return;
        if (gameState.constructionQueue.length > 0) return;

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
            constructionQueue: [{
                id: now.toString(),
                type: 'research',
                itemId: researchId,
                targetLevel: currentLevel + 1,
                startTime: now,
                endTime: now + buildTime
            }]
        }));
    };

    const buildShip = (shipId: ShipId, amount: number) => {
        const ship = SHIPS[shipId];
        const totalCost = { metal: ship.baseCost.metal * amount, crystal: ship.baseCost.crystal * amount, deuterium: ship.baseCost.deuterium * amount };
        if (gameState.resources.metal < totalCost.metal || gameState.resources.crystal < totalCost.crystal || gameState.resources.deuterium < totalCost.deuterium) return;
        const shipyardLevel = gameState.buildings[BuildingId.SHIPYARD];
        if (shipyardLevel === 0) return;

        const singleBuildTime = (ship.buildTime * 1000) / (shipyardLevel + 1) / GAME_SPEED;
        const now = Date.now();
        let startTime = now;
        if (gameState.shipyardQueue.length > 0) startTime = gameState.shipyardQueue[gameState.shipyardQueue.length - 1].endTime;

        const newItem: ConstructionItem = {
            id: now.toString() + Math.random(),
            type: 'ship',
            itemId: shipId,
            quantity: amount,
            startTime: startTime,
            endTime: startTime + (singleBuildTime * amount)
        };

        setGameState(prev => ({
            ...prev,
            resources: {
                ...prev.resources,
                metal: prev.resources.metal - totalCost.metal,
                crystal: prev.resources.crystal - totalCost.crystal,
                deuterium: prev.resources.deuterium - totalCost.deuterium
            },
            shipyardQueue: [...prev.shipyardQueue, newItem]
        }));
    };

    const renamePlanet = (newName: string) => { setGameState(prev => ({ ...prev, planetName: newName })); };
    const updateProductionSetting = (buildingId: BuildingId, percent: number) => { setGameState(prev => ({ ...prev, productionSettings: { ...prev.productionSettings, [buildingId]: percent } })); };
    const resetGame = () => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); };
    const clearLogs = () => { setGameState(prev => ({ ...prev, missionLogs: [] })); };
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

    const updateAvatar = (url: string) => { setGameState(prev => ({ ...prev, avatarUrl: url })); };

    const getPlayersInSystem = async (galaxy: number, system: number) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, planet_name, galaxy_coords, points, production_settings, buildings')
            .contains('galaxy_coords', { galaxy, system });

        if (error) {
            console.error("Error fetching system users:", error);
            return [];
        }
        return data || [];
    };

    const renameUser = (name: string) => {
        setGameState(prev => ({ ...prev, nickname: name }));
    };

    // Main Loop
    useEffect(() => {
        if (!loaded) return;

        const tick = () => {
            const now = Date.now();
            setGameState(prev => {
                const production = calculateProduction(prev);
                const secondsPassed = (now - prev.lastTick) / 1000;
                if (secondsPassed <= 0) return prev;

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

                if (newQueue.length > 0 && now >= newQueue[0].endTime) {
                    const item = newQueue[0];
                    if (item.type === 'building') newBuildings[item.itemId as BuildingId] = (item.targetLevel || 1);
                    else if (item.type === 'research') newResearch[item.itemId as ResearchId] = (item.targetLevel || 1);
                    newQueue.shift();
                }

                let newShips = { ...prev.ships };
                let newShipQueue = [...prev.shipyardQueue];
                while (newShipQueue.length > 0 && now >= newShipQueue[0].endTime) {
                    const completed = newShipQueue.shift();
                    if (completed) newShips[completed.itemId as ShipId] = (newShips[completed.itemId as ShipId] || 0) + (completed.quantity || 0);
                }

                // Missions are now handled asynchronously in a separate useEffect
                // const processedMissionState = handleMissions({ ...prev, activeMissions: prev.activeMissions, missionLogs: prev.missionLogs, ships: newShips, resources: newResources } as GameState, now);

                return {
                    ...prev,
                    resources: {
                        ...newResources, // Updated resources
                        storage: production.storage
                    },
                    buildings: newBuildings,
                    research: newResearch,
                    ships: newShips,
                    constructionQueue: newQueue,
                    shipyardQueue: newShipQueue,
                    activeMissions: prev.activeMissions, // Managed by sync
                    missionLogs: prev.missionLogs,
                    productionRates: { metal: production.metal, crystal: production.crystal, deuterium: production.deuterium },
                    lastTick: now
                };
            });
        };

        const interval = setInterval(tick, TICK_RATE);
        return () => clearInterval(interval);
    }, [loaded]);

    const contextValue: GameContextType = {
        ...gameState,
        upgradeBuilding,
        upgradeResearch,
        buildShip,
        sendExpedition,
        sendAttack,
        sendSpyProbe,
        sendTransport,
        cancelMission,
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
        getPlayersInSystem,
        renameUser
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
