
import React, { useState } from 'react';
import { useGame } from '../GameContext';
import { IMAGES, SHIPS, PLANET_IMAGES } from '../constants';
import { ShipId } from '../types';

interface SpyReport {
    metal: number;
    crystal: number;
    deuterium: number;
    energy: number;
    ships: number;
    defense: number;
}

const Galaxy: React.FC = () => {
    const { planetName, ships, sendSpyProbe, sendAttack, sendTransport, sendColonize, planets, resources, galaxyCoords, mainPlanetCoords, planetType, getPlayersInSystem, userId, buildings, currentPlanetId, mainPlanetName, level } = useGame();

    // Start at current planet's coords, or 1:1 if not available
    const [coords, setCoords] = useState({
        galaxy: galaxyCoords?.galaxy || 1,
        system: galaxyCoords?.system || 1
    });

    const [systemUsers, setSystemUsers] = useState<any[]>([]);
    const [spyReport, setSpyReport] = useState<SpyReport | null>(null);
    const [spyModal, setSpyModal] = useState<{ galaxy: number, system: number, pos: number, name: string } | null>(null);
    const [attackModal, setAttackModal] = useState<{ galaxy: number, system: number, pos: number, name: string } | null>(null);
    const [transportModal, setTransportModal] = useState<{ galaxy: number, system: number, pos: number, name: string } | null>(null);
    const [selectedShips, setSelectedShips] = useState<Record<string, number>>({});
    const [selectedResources, setSelectedResources] = useState({ metal: 0, crystal: 0, deuterium: 0 });
    const [probeCount, setProbeCount] = useState(1);
    const [colonizeModal, setColonizeModal] = useState<{ galaxy: number, system: number, pos: number } | null>(null);
    const [colonizeResources, setColonizeResources] = useState({ metal: 0, crystal: 0, deuterium: 0 });
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // Get users in current system
    React.useEffect(() => {
        getPlayersInSystem(coords.galaxy, coords.system).then(setSystemUsers);
    }, [coords.galaxy, coords.system, getPlayersInSystem]);

    const getPlanet = (pos: number) => {
        // MAIN PLANET: Always check mainPlanetCoords (doesn't change when switching colonies)
        const mainCoords = mainPlanetCoords || galaxyCoords;
        if (mainCoords &&
            coords.galaxy === mainCoords.galaxy &&
            coords.system === mainCoords.system &&
            mainCoords.position === pos) {

            const pType = planetType === 'ice' ? "Lodowa" : (planetType === 'desert' ? "Pustynna" : "Ziemiopodobna");

            // Use Commander Level from context
            const myLevel = level || 1;

            // Determine name to show:
            // If we are currently ON the main planet (currentPlanetId is null), use current 'planetName'.
            // If we are on a COLONY (currentPlanetId is set), use stored 'mainPlanetName' (or default 'Główna').
            const displayName = currentPlanetId ? (mainPlanetName || 'Główna') : planetName;

            return {
                name: displayName,
                player: "Ty",
                rank: myLevel,
                img: PLANET_IMAGES[planetType] || IMAGES.planet,
                type: pType,
                isPlayer: true,
                activity: "",
                isSelected: !currentPlanetId // Main planet is selected if currentPlanetId is null
            };
        }

        // CHECK PLAYER COLONIES (from planets table)
        const myColony = planets.find(p =>
            p.galaxy_coords?.galaxy === coords.galaxy &&
            p.galaxy_coords?.system === coords.system &&
            p.galaxy_coords?.position === pos
        );
        if (myColony) {
            const pType = myColony.planet_type === 'ice' ? "Lodowa" : (myColony.planet_type === 'desert' ? "Pustynna" : "Ziemiopodobna");
            return {
                name: myColony.planet_name || "Kolonia",
                player: "Ty (Kolonia)",
                rank: 0,
                img: PLANET_IMAGES[myColony.planet_type] || IMAGES.planet,
                type: pType,
                isPlayer: true,
                isColony: true,
                colonyId: myColony.id,
                activity: ""
            };
        }

        // CHECK OTHER PLAYERS
        const otherPlayer = systemUsers.find(u => u.galaxy_coords?.position === pos && u.id !== userId);
        if (otherPlayer) {
            const pType = otherPlayer.production_settings?.planetType === 'ice' ? "Lodowa" : (otherPlayer.production_settings?.planetType === 'desert' ? "Pustynna" : "Ziemiopodobna");
            const avatar = otherPlayer.production_settings?.avatarUrl || "/kosmo/avatars/avatar_default.png";

            // Use Commander Level from database
            const playerLevel = otherPlayer.level || 1;

            return {
                name: otherPlayer.planet_name || "Nieznana Kolonia",
                player: otherPlayer.production_settings?.nickname || "Gracz",
                rank: playerLevel,
                img: PLANET_IMAGES[otherPlayer.production_settings?.planetType] || IMAGES.planet,
                type: pType,
                isPlayer: false,
                isBot: false,
                activity: "" // TODO: Online status
            };
        }



        // All other slots are empty
        return null;
    };

    const calculateRank = (points: number) => {
        if (!points) return 0;
        return Math.floor(points / 100) + 1; // Dummy rank calc
    };


    const openSpyModal = (pos: number) => {
        const planet = getPlanet(pos);
        if (planet) {
            setSpyModal({ galaxy: coords.galaxy, system: coords.system, pos, name: planet.name });
            setProbeCount(1);
            setStatusMessage(null);
        }
    };

    const handleSendSpy = async () => {
        if (!spyModal) return;

        const success = await sendSpyProbe(probeCount, { galaxy: coords.galaxy, system: coords.system, position: spyModal.pos });
        if (success !== false) {
            setStatusMessage("Wysyłanie sond...");
            // Simulate flight time
            setTimeout(() => {
                const isBot = coords.galaxy === 1 && coords.system === 1 && spyModal.pos === 2;
                if (isBot) {
                    setSpyReport({
                        metal: Math.floor(Math.random() * 50000) + 10000,
                        crystal: Math.floor(Math.random() * 30000) + 5000,
                        deuterium: Math.floor(Math.random() * 10000) + 2000,
                        energy: 4000,
                        ships: Math.floor(Math.random() * 50),
                        defense: Math.floor(Math.random() * 20),
                    });
                }
                setSpyModal(null);
            }, 1500);
        } else {
            setStatusMessage("Brak wystarczającej ilości sond!");
        }
    };

    // Update coordinates ensuring bounds
    const changeSystem = (delta: number) => {
        setCoords(prev => {
            const next = prev.system + delta;
            if (next < 1) return prev;
            if (next > 499) return prev;
            return { ...prev, system: next };
        });
    };

    const changeGalaxy = (delta: number) => {
        setCoords(prev => {
            const next = prev.galaxy + delta;
            if (next < 1) return prev;
            if (next > 9) return prev;
            return { ...prev, galaxy: next };
        });
    }

    const slots = Array.from({ length: 15 }, (_, i) => i + 1);
    const availableProbes = ships[ShipId.ESPIONAGE_PROBE] || 0;

    return (
        <div className="flex flex-col gap-6 pb-20 relative min-h-full">

            {/* Solar System Visual - Background Effect (Absolute Positioned to prevent layout shift) */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-0 opacity-40 w-full flex justify-center overflow-hidden">
                <div className="w-[600px] h-[600px] rounded-full bg-yellow-500/20 blur-[120px] -translate-y-1/2"></div>
                <div className="absolute top-0 w-[300px] h-[300px] rounded-full bg-orange-500/10 blur-[60px] animate-pulse -translate-y-1/2"></div>
            </div>

            {/* Navigation Header */}
            <div className="bg-[#1c2136] p-4 rounded-xl border border-white/10 shadow-lg sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

                    {/* Coordinates Control */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="flex-1 flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-[#929bc9] tracking-wider text-center">Galaktyka</span>
                            <div className="flex items-center h-10 md:h-12 bg-[#111422] rounded-lg border border-white/10 overflow-hidden">
                                <button onClick={() => changeGalaxy(-1)} className="w-8 md:w-12 h-full hover:bg-white/5 active:bg-white/10 flex items-center justify-center text-[#929bc9]">
                                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                                </button>
                                <div className="flex-1 text-center font-mono font-bold text-lg md:text-xl text-white">{coords.galaxy}</div>
                                <button onClick={() => changeGalaxy(1)} className="w-8 md:w-12 h-full hover:bg-white/5 active:bg-white/10 flex items-center justify-center text-[#929bc9]">
                                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-[#929bc9] tracking-wider text-center">Układ</span>
                            <div className="flex items-center h-10 md:h-12 bg-[#111422] rounded-lg border border-white/10 overflow-hidden">
                                <button onClick={() => changeSystem(-1)} className="w-8 md:w-12 h-full hover:bg-white/5 active:bg-white/10 flex items-center justify-center text-[#929bc9]">
                                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                                </button>
                                <div className="flex-1 text-center font-mono font-bold text-lg md:text-xl text-white">{coords.system}</div>
                                <button onClick={() => changeSystem(1)} className="w-8 md:w-12 h-full hover:bg-white/5 active:bg-white/10 flex items-center justify-center text-[#929bc9]">
                                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Button - Hidden for now
                    <button className="w-full md:w-auto h-10 md:h-12 px-8 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm md:text-base">
                        <span className="material-symbols-outlined text-lg">rocket_launch</span>
                        <span>Skanuj Układ</span>
                    </button>
                    */}
                </div>
            </div>

            {/* Planet Grid */}
            <div className="flex flex-col gap-3 relative z-10">
                {slots.map((pos) => {
                    const planet = getPlanet(pos);

                    return (
                        <div key={pos} className={`relative flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border transition-all ${planet?.isPlayer ? 'bg-[#1a2342] border-primary/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-[#1c2136] border-white/5 hover:border-white/20'}`}>

                            {/* Position Number */}
                            <div className="flex flex-col items-center justify-center w-6 md:w-8 text-[#929bc9] font-mono text-xs md:text-sm opacity-50">
                                {pos}
                            </div>

                            {/* Planet Visual */}
                            <div className="shrink-0">
                                {!planet ? (
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center opacity-20">
                                        <span className="material-symbols-outlined text-white text-base">add</span>
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg relative overflow-hidden bg-black/20">
                                        <img src={planet.img} alt="Planet" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 rounded-full bg-black/10"></div>
                                        {/* Orbit Line visual decoration */}
                                        <div className="absolute -inset-1 rounded-full border border-white/10 opacity-50"></div>
                                    </div>
                                )}
                            </div>

                            {/* Planet Info */}
                            <div className="flex-1 min-w-0">
                                {planet ? (
                                    <div className="flex flex-col justify-center">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`font-bold text-sm md:text-base truncate ${planet.isPlayer ? 'text-primary' : (planet.isBot ? 'text-red-400' : 'text-white')}`}>
                                                {planet.name}
                                            </span>
                                            <span className="text-[#929bc9] text-sm">
                                                ({planet.player})
                                            </span>
                                            {planet.activity && <span className="text-[9px] text-red-400">(*)</span>}
                                        </div>
                                        {planet.rank && <div className="text-xs text-green-400 font-mono">Level {planet.rank}</div>}
                                    </div>
                                ) : (
                                    <span className="text-white/20 text-xs md:text-sm italic">Pusta przestrzeń</span>
                                )}
                            </div>

                            {/* Actions (Mobile Friendly) */}
                            <div className="flex items-center gap-1">
                                {!planet ? (
                                    <button
                                        onClick={() => {
                                            if ((ships[ShipId.COLONY_SHIP] || 0) < 1) {
                                                alert('Potrzebujesz Statku Kolonizacyjnego!');
                                                return;
                                            }
                                            if (planets.length >= 8) {
                                                alert('Osiągnąłeś limit 8 planet!');
                                                return;
                                            }
                                            setColonizeModal({ galaxy: coords.galaxy, system: coords.system, pos });
                                            setColonizeResources({ metal: 0, crystal: 0, deuterium: 0 });
                                        }}
                                        className="w-8 h-8 rounded bg-white/5 hover:bg-green-500/20 hover:text-green-400 text-[#929bc9] flex items-center justify-center border border-white/5 transition-colors"
                                        title={`Kolonizuj (Masz: ${ships[ShipId.COLONY_SHIP] || 0} statków kolonizacyjnych)`}
                                    >
                                        <span className="material-symbols-outlined text-lg">flag</span>
                                    </button>
                                ) : planet.isPlayer && !planet.isSelected ? (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => {
                                                setTransportModal({ galaxy: coords.galaxy, system: coords.system, pos, name: planet.name });
                                                setSelectedShips({});
                                                setSelectedResources({ metal: 0, crystal: 0, deuterium: 0 });
                                                setStatusMessage(null);
                                            }}
                                            className="w-8 h-8 rounded bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-[#929bc9] flex items-center justify-center border border-white/5 transition-colors" title="Transportuj Surowce">
                                            <span className="material-symbols-outlined text-lg">local_shipping</span>
                                        </button>
                                    </div>
                                ) : !planet.isPlayer && !planet.isBot ? (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openSpyModal(pos)}
                                            className="w-8 h-8 rounded bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-[#929bc9] flex items-center justify-center border border-white/5 transition-colors" title="Szpieguj">
                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAttackModal({ galaxy: coords.galaxy, system: coords.system, pos, name: planet.name });
                                                setSelectedShips({});
                                                setStatusMessage(null);
                                            }}
                                            className="w-8 h-8 rounded bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-[#929bc9] flex items-center justify-center border border-white/5 transition-colors" title="Atakuj">
                                            <span className="material-symbols-outlined text-lg">swords</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setTransportModal({ galaxy: coords.galaxy, system: coords.system, pos, name: planet.name });
                                                setSelectedShips({});
                                                setSelectedResources({ metal: 0, crystal: 0, deuterium: 0 });
                                                setStatusMessage(null);
                                            }}
                                            className="w-8 h-8 rounded bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-[#929bc9] flex items-center justify-center border border-white/5 transition-colors" title="Transportuj">
                                            <span className="material-symbols-outlined text-lg">local_shipping</span>
                                        </button>
                                    </div>
                                ) : planet.isBot && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openSpyModal(pos)}
                                            className="w-8 h-8 rounded bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-[#929bc9] flex items-center justify-center border border-white/5 transition-colors" title="Szpieguj">
                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAttackModal({ galaxy: coords.galaxy, system: coords.system, pos, name: planet.name });
                                                setSelectedShips({});
                                                setStatusMessage(null);
                                            }}
                                            className="w-8 h-8 rounded bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-[#929bc9] flex items-center justify-center border border-white/5 transition-colors" title="Atakuj">
                                            <span className="material-symbols-outlined text-lg">swords</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Spy Launch Modal */}
            {
                spyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#1c2136] w-full max-w-sm rounded-xl border border-purple-500/50 shadow-2xl p-6 relative">
                            <button onClick={() => setSpyModal(null)} className="absolute top-4 right-4 text-[#929bc9] hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>

                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <span className="material-symbols-outlined text-purple-400 text-3xl">visibility</span>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Wyślij Sondy</h3>
                                    <p className="text-xs text-[#929bc9]">Cel: {spyModal.name} [{spyModal.galaxy}:{spyModal.system}:{spyModal.pos}]</p>
                                </div>
                            </div>

                            {statusMessage ? (
                                <div className="text-center py-4">
                                    <p className={`text-lg font-bold ${statusMessage.includes('Wysyłanie') ? 'text-green-400' : 'text-red-400'}`}>{statusMessage}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="bg-[#111422] p-4 rounded-lg border border-white/5 text-center">
                                        <p className="text-sm text-[#929bc9] mb-2">Dostępne sondy</p>
                                        <p className="text-2xl font-mono text-white font-bold">{availableProbes}</p>
                                    </div>

                                    <div className="flex items-center bg-[#111422] rounded-lg border border-white/10 overflow-hidden">
                                        <button
                                            onClick={() => setProbeCount(Math.max(1, probeCount - 1))}
                                            className="w-12 h-12 flex items-center justify-center text-[#929bc9] hover:bg-white/5"
                                        >
                                            <span className="material-symbols-outlined">remove</span>
                                        </button>
                                        <input
                                            type="number"
                                            className="flex-1 bg-transparent text-center text-white font-bold text-lg focus:outline-none"
                                            value={probeCount}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => setProbeCount(Math.min(availableProbes, Math.max(1, parseInt(e.target.value) || 1)))}
                                            max={availableProbes}
                                        />
                                        <button
                                            onClick={() => setProbeCount(Math.min(availableProbes, probeCount + 1))}
                                            className="w-12 h-12 flex items-center justify-center text-[#929bc9] hover:bg-white/5"
                                        >
                                            <span className="material-symbols-outlined">add</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleSendSpy}
                                        disabled={availableProbes < 1}
                                        className={`w-full py-3 rounded-lg font-bold uppercase tracking-widest transition-colors ${availableProbes > 0 ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-[#232948] text-white/20 cursor-not-allowed'}`}
                                    >
                                        Wyślij Flotę
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Attack Modal */}
            {
                attackModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#1c2136] w-full max-w-lg rounded-xl border border-red-500/50 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                            <button onClick={() => setAttackModal(null)} className="absolute top-4 right-4 text-[#929bc9] hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>

                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <span className="material-symbols-outlined text-red-500 text-3xl">swords</span>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Rozpocznij Atak</h3>
                                    <p className="text-xs text-[#929bc9]">Cel: {attackModal.name} [{attackModal.galaxy}:{attackModal.system}:{attackModal.pos}]</p>
                                </div>
                            </div>

                            {statusMessage ? (
                                <div className="text-center py-8">
                                    <p className={`text-xl font-bold ${statusMessage.includes('Wysyłanie') ? 'text-green-400' : 'text-red-400'}`}>{statusMessage}</p>
                                    {statusMessage.includes('Wysyłanie') && (
                                        <p className="text-sm text-[#929bc9] mt-2">Flota dotrze do celu za 5 minut.</p>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-1 gap-2">
                                        {Object.entries(ships).map(([id, count]) => {
                                            if (count <= 0 || id === 'solarSatellite' || id === 'crawlers') return null; // Skip satellites/crawlers/empty
                                            const current = selectedShips[id] || 0;
                                            return (
                                                <div key={id} className="flex items-center justify-between bg-[#111422] p-3 rounded-lg border border-white/5">
                                                    <span className="text-sm text-[#929bc9] font-bold capitalize">{SHIPS[id as ShipId]?.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-[#555a7a] mr-2">Dostępne: {count}</span>
                                                        <input
                                                            type="number"
                                                            max={count}
                                                            min={0}
                                                            value={current}
                                                            onFocus={(e) => e.target.select()}
                                                            onChange={(e) => {
                                                                const val = Math.min(count, Math.max(0, parseInt(e.target.value) || 0));
                                                                setSelectedShips(prev => ({ ...prev, [id]: val }));
                                                            }}
                                                            className="w-20 bg-black/20 border border-white/10 rounded px-2 py-1 text-right text-white focus:outline-none focus:border-red-500"
                                                        />
                                                        <button onClick={() => setSelectedShips(prev => ({ ...prev, [id]: count }))} className="text-xs text-red-400 hover:text-white px-2 uppercase font-bold">Max</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {Object.values(ships).every(c => !c) && <p className="text-center text-white/20 italic">Brak dostępnych statków bojowych.</p>}
                                    </div>

                                    <button
                                        onClick={() => {
                                            const hasShips = Object.values(selectedShips).some(v => v > 0);
                                            if (!hasShips) {
                                                setStatusMessage("Wybierz przynajmniej jeden statek!");
                                                return;
                                            }
                                            sendAttack(selectedShips as Record<ShipId, number>, { galaxy: coords.galaxy, system: coords.system, position: attackModal.pos });
                                            setStatusMessage("Wysyłanie floty...");
                                            setTimeout(() => setAttackModal(null), 2000);
                                        }}
                                        className="w-full py-4 mt-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-red-900/20 transition-all active:scale-95"
                                    >
                                        Wyślij Atak
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Transport Modal */}
            {
                transportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#1c2136] w-full max-w-lg rounded-xl border border-blue-500/50 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                            <button onClick={() => setTransportModal(null)} className="absolute top-4 right-4 text-[#929bc9] hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>

                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <span className="material-symbols-outlined text-blue-500 text-3xl">local_shipping</span>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Transportuj Surowce</h3>
                                    <p className="text-xs text-[#929bc9]">Cel: {transportModal.name} [{transportModal.galaxy}:{transportModal.system}:{transportModal.pos}]</p>
                                </div>
                            </div>

                            {statusMessage ? (
                                <div className="text-center py-8">
                                    <p className={`text-xl font-bold ${statusMessage.includes('Wysyłanie') ? 'text-green-400' : 'text-blue-400'}`}>{statusMessage}</p>
                                    {statusMessage.includes('Wysyłanie') && (
                                        <p className="text-sm text-[#929bc9] mt-2">Dostawa dotrze za 5 minut.</p>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    {/* Ships Selection */}
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-2">Wybierz Statki</h4>
                                        <div className="grid grid-cols-1 gap-2 bg-[#111422] p-2 rounded-lg border border-white/5">
                                            {Object.entries(ships).map(([id, count]) => {
                                                if (count <= 0 || id === 'solarSatellite' || id === 'crawlers' || id === 'espionageProbe') return null;
                                                const current = selectedShips[id] || 0;
                                                return (
                                                    <div key={id} className="flex items-center justify-between p-2 rounded hover:bg-white/5">
                                                        <span className="text-xs text-[#929bc9] font-bold capitalize">{SHIPS[id as ShipId]?.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-[#555a7a] mr-1">Max: {count}</span>
                                                            <input
                                                                type="number"
                                                                max={count}
                                                                min={0}
                                                                value={current}
                                                                onFocus={(e) => e.target.select()}
                                                                onChange={(e) => {
                                                                    const val = Math.min(count, Math.max(0, parseInt(e.target.value) || 0));
                                                                    setSelectedShips(prev => ({ ...prev, [id]: val }));
                                                                }}
                                                                className="w-16 bg-black/20 border border-white/10 rounded px-1 py-1 text-right text-xs text-white focus:outline-none focus:border-blue-500"
                                                            />
                                                            <button onClick={() => setSelectedShips(prev => ({ ...prev, [id]: count }))} className="text-[10px] text-blue-400 hover:text-white px-1 font-bold">ALL</button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {Object.values(ships).every(c => !c) && <p className="text-center text-white/20 italic text-xs">Brak dostępnych transporterów.</p>}
                                        </div>
                                    </div>

                                    {/* Resources Selection */}
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <h4 className="text-sm font-bold text-white">Załaduj Surowce</h4>
                                            <span className={`text-xs font-mono ${(selectedResources.metal + selectedResources.crystal + selectedResources.deuterium) > Object.entries(selectedShips).reduce((acc, [id, count]) => acc + (count * (SHIPS[id as ShipId]?.capacity || 0)), 0) ? 'text-red-400' : 'text-blue-400'}`}>
                                                Ładowność: {(selectedResources.metal + selectedResources.crystal + selectedResources.deuterium).toLocaleString()} / {Object.entries(selectedShips).reduce((acc, [id, count]) => acc + (count * (SHIPS[id as ShipId]?.capacity || 0)), 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {['metal', 'crystal', 'deuterium'].map(res => {
                                                const resKey = res as 'metal' | 'crystal' | 'deuterium';
                                                const totalCapacity = Object.entries(selectedShips).reduce((acc, [id, count]) => acc + (count * (SHIPS[id as ShipId]?.capacity || 0)), 0);
                                                const currentLoad = selectedResources.metal + selectedResources.crystal + selectedResources.deuterium;
                                                // Remaining capacity calculated *without* the current resource amount being edited, to find the "headroom" available for THIS resource
                                                const otherResourcesLoad = currentLoad - (selectedResources[resKey] || 0);
                                                const remainingCapacityForThisSlot = Math.max(0, totalCapacity - otherResourcesLoad);

                                                const maxAvailable = Math.min(
                                                    resources[resKey] || 0,
                                                    remainingCapacityForThisSlot
                                                );

                                                return (
                                                    <div key={res} className="flex items-center gap-3">
                                                        <div className="w-20 text-xs uppercase font-bold text-[#929bc9]">{res === 'metal' ? 'Metal' : (res === 'crystal' ? 'Kryształ' : 'Deuter')}</div>
                                                        <div className="flex-1 relative">
                                                            <input
                                                                type="number"
                                                                value={selectedResources[resKey] || 0}
                                                                onFocus={(e) => e.target.select()}
                                                                onChange={(e) => {
                                                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                                                    setSelectedResources(prev => ({ ...prev, [resKey]: val }));
                                                                }}
                                                                className={`w-full bg-[#111422] border rounded px-3 py-2 text-white font-mono text-sm focus:border-blue-500 outline-none ${selectedResources[resKey] > (resources[resKey] || 0) ? 'border-red-500 text-red-400' : 'border-white/10'}`}
                                                                placeholder="0"
                                                            />
                                                            <button
                                                                onClick={() => setSelectedResources(prev => {
                                                                    const currentVal = prev[resKey];
                                                                    const others = (prev.metal + prev.crystal + prev.deuterium) - currentVal;
                                                                    const spaceLeft = Math.max(0, totalCapacity - others);
                                                                    const newMax = Math.min(resources[resKey] || 0, spaceLeft);
                                                                    return { ...prev, [resKey]: newMax };
                                                                })}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-blue-400 hover:text-white font-bold uppercase"
                                                            >
                                                                MAX
                                                            </button>
                                                        </div>
                                                        <div className="text-[10px] text-[#929bc9] w-16 text-right">
                                                            / {(resources[resKey] || 0).toLocaleString()}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            const hasShips = Object.values(selectedShips).some(v => v > 0);
                                            if (!hasShips) {
                                                setStatusMessage("Wybierz statki transportowe!");
                                                return;
                                            }
                                            const totalLoad = selectedResources.metal + selectedResources.crystal + selectedResources.deuterium;
                                            const totalCapacity = Object.entries(selectedShips).reduce((acc, [id, count]) => acc + (count * (SHIPS[id as ShipId]?.capacity || 0)), 0);

                                            if (totalLoad > totalCapacity) {
                                                setStatusMessage(`Przeładowanie! (Limit: ${totalCapacity.toLocaleString()})`);
                                                return;
                                            }
                                            sendTransport(selectedShips as Record<ShipId, number>, selectedResources, { galaxy: coords.galaxy, system: coords.system, position: transportModal.pos });
                                            setStatusMessage("Wysyłanie floty transportowej...");
                                            setTimeout(() => setTransportModal(null), 2000);
                                        }}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                                    >
                                        Wyślij Transport
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Espionage Report Modal */}
            {
                spyReport && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#1c2136] w-full max-w-md rounded-xl border border-purple-500/50 shadow-2xl p-6 relative">
                            <button onClick={() => setSpyReport(null)} className="absolute top-4 right-4 text-[#929bc9] hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>

                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <span className="material-symbols-outlined text-purple-400 text-3xl">description</span>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Raport Szpiegowski</h3>
                                    <p className="text-xs text-[#929bc9]">Baza Piracka [1:1:2]</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-[#111422] p-3 rounded-lg border border-white/5">
                                    <span className="text-[10px] uppercase font-bold text-[#929bc9]">Surowce</span>
                                    <div className="flex flex-col gap-1 mt-2 text-sm">
                                        <div className="flex justify-between"><span className="text-[#929bc9]">Metal</span> <span className="text-white font-mono">{spyReport.metal.toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span className="text-[#929bc9]">Kryształ</span> <span className="text-white font-mono">{spyReport.crystal.toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span className="text-[#929bc9]">Deuter</span> <span className="text-white font-mono">{spyReport.deuterium.toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span className="text-[#929bc9]">Energia</span> <span className="text-white font-mono">{spyReport.energy.toLocaleString()}</span></div>
                                    </div>
                                </div>
                                <div className="bg-[#111422] p-3 rounded-lg border border-white/5">
                                    <span className="text-[10px] uppercase font-bold text-[#929bc9]">Flota i Obrona</span>
                                    <div className="flex flex-col gap-1 mt-2 text-sm">
                                        <div className="flex justify-between"><span className="text-[#929bc9]">Statki</span> <span className="text-red-400 font-mono font-bold">{spyReport.ships}</span></div>
                                        <div className="flex justify-between"><span className="text-[#929bc9]">Obrona</span> <span className="text-blue-400 font-mono font-bold">{spyReport.defense}</span></div>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setSpyReport(null)} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors">
                                Zamknij Raport
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Colonize Modal */}
            {
                colonizeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#1c2136] w-full max-w-md rounded-xl border border-green-500/50 shadow-2xl p-6 relative">
                            <button onClick={() => setColonizeModal(null)} className="absolute top-4 right-4 text-[#929bc9] hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>

                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <span className="material-symbols-outlined text-green-400 text-3xl">flag</span>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Kolonizuj Planetę</h3>
                                    <p className="text-xs text-[#929bc9]">[{colonizeModal.galaxy}:{colonizeModal.system}:{colonizeModal.pos}]</p>
                                </div>
                            </div>

                            <div className="bg-[#111422] p-4 rounded-lg border border-white/5 mb-4">
                                <p className="text-sm text-[#929bc9] mb-2">Statek Kolonizacyjny zostanie zużyty.</p>
                                <p className="text-xs text-green-400">Posiadasz: {ships[ShipId.COLONY_SHIP] || 0} statków kolonizacyjnych</p>
                                <p className="text-xs text-yellow-400 mt-1">Planety: {planets.length}/8</p>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-bold text-white">Wyślij surowce z nową kolonią:</p>
                                    <button
                                        onClick={() => setColonizeResources({
                                            metal: Math.min(resources.metal, 15000),
                                            crystal: Math.min(resources.crystal, 15000),
                                            deuterium: Math.min(resources.deuterium, 15000)
                                        })}
                                        className="px-2 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 text-xs font-bold rounded border border-green-500/30"
                                    >
                                        MAX (15k)
                                    </button>
                                </div>
                                <p className="text-xs text-yellow-400 mb-3">Limit: 15,000 każdego surowca</p>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#929bc9] text-xs w-16">Metal:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="15000"
                                            value={colonizeResources.metal}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => setColonizeResources(p => ({ ...p, metal: Math.min(15000, Math.max(0, parseInt(e.target.value) || 0)) }))}
                                            className="flex-1 bg-[#111422] border border-white/10 rounded px-2 py-1 text-white text-sm"
                                        />
                                        <span className="text-gray-500 text-xs">/ 15k</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#929bc9] text-xs w-16">Kryształ:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="15000"
                                            value={colonizeResources.crystal}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => setColonizeResources(p => ({ ...p, crystal: Math.min(15000, Math.max(0, parseInt(e.target.value) || 0)) }))}
                                            className="flex-1 bg-[#111422] border border-white/10 rounded px-2 py-1 text-white text-sm"
                                        />
                                        <span className="text-gray-500 text-xs">/ 15k</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#929bc9] text-xs w-16">Deuter:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="15000"
                                            value={colonizeResources.deuterium}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => setColonizeResources(p => ({ ...p, deuterium: Math.min(15000, Math.max(0, parseInt(e.target.value) || 0)) }))}
                                            className="flex-1 bg-[#111422] border border-white/10 rounded px-2 py-1 text-white text-sm"
                                        />
                                        <span className="text-gray-500 text-xs">/ 15k</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    const targetCoords = { galaxy: colonizeModal.galaxy, system: colonizeModal.system, position: colonizeModal.pos };
                                    console.log('🎯 [COLONIZE] Sending to coords:', targetCoords);
                                    const success = await sendColonize(targetCoords, colonizeResources);
                                    if (success) {
                                        setColonizeModal(null);
                                        setStatusMessage('🎉 Nowa kolonia założona!');
                                    }
                                }}
                                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">rocket_launch</span>
                                Kolonizuj!
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Galaxy;
