
import React, { useState } from 'react';
import { useGame } from '../GameContext';
import { IMAGES } from '../constants';
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
    // Start at Galaxy 1, System 1 to see player immediately
    const [coords, setCoords] = useState({ galaxy: 1, system: 1 });
    const { planetName, ships, sendSpyProbe, galaxyCoords, planetType } = useGame();
    const [spyReport, setSpyReport] = useState<SpyReport | null>(null);
    const [spyModal, setSpyModal] = useState<{ pos: number, name: string } | null>(null);
    const [probeCount, setProbeCount] = useState(1);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const getPlanet = (pos: number) => {
        // PLAYER HOME: Dynamic check
        if (galaxyCoords &&
            coords.galaxy === galaxyCoords.galaxy &&
            coords.system === galaxyCoords.system &&
            galaxyCoords.position === pos) {

            const pType = planetType === 'ice' ? "Lodowa" : (planetType === 'desert' ? "Pustynna" : "Ziemiopodobna");

            return {
                name: planetName,
                player: "Ty",
                rank: 1, // TODO: Fetch rank
                img: IMAGES.planet,
                type: pType,
                isPlayer: true,
                activity: ""
            };
        }

        // BOT PLANET: Always at [1:1:2]
        if (coords.galaxy === 1 && coords.system === 1 && pos === 2) {
            return {
                name: "Piracka Baza",
                player: "SpacePirate",
                rank: 666,
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCttLEph3WsOd3HRlZC0zxgyo5HtGQLhoc_Nr46u_bMbqY6nTEQYuIV_gyR_hpfVBS-J_jj5GGZynbPPZti1oj5iZ3eOY_YBYNi3q8nw6c4ebgmqCgJnaJhFtJwFfpNu4nYT65VMgmQkWQU-ek95Y5Ue6RnI9LCcYQpDhod0Y_eUiJYtnqiu9_aD-u_ukPsujkP5hgKqFchbR8vhUje3E-LrA80lMR4QTQEfNKXUDobsJRFGe11_CQSYumUsrXBnYunhGfRGvl2epw",
                type: "Pustynna",
                isPlayer: false,
                isBot: true,
                activity: "15 min"
            };
        }

        // All other slots are empty
        return null;
    };

    const openSpyModal = (pos: number) => {
        const planet = getPlanet(pos);
        if (planet) {
            setSpyModal({ pos, name: planet.name });
            setProbeCount(1);
            setStatusMessage(null);
        }
    };

    const handleSendSpy = () => {
        if (!spyModal) return;

        const success = sendSpyProbe(probeCount);
        if (success) {
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

                    {/* Action Button */}
                    <button className="w-full md:w-auto h-10 md:h-12 px-8 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm md:text-base">
                        <span className="material-symbols-outlined text-lg">rocket_launch</span>
                        <span>Skanuj Układ</span>
                    </button>
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
                                        {planet.rank && <div className="text-xs text-white/30">Rank #{planet.rank}</div>}
                                    </div>
                                ) : (
                                    <span className="text-white/20 text-xs md:text-sm italic">Pusta przestrzeń</span>
                                )}
                            </div>

                            {/* Actions (Mobile Friendly) */}
                            <div className="flex items-center gap-1">
                                {!planet ? (
                                    <button className="w-8 h-8 rounded bg-white/5 hover:bg-primary hover:text-white text-[#929bc9] flex items-center justify-center border border-white/5 transition-colors" title="Kolonizuj">
                                        <span className="material-symbols-outlined text-lg">flag</span>
                                    </button>
                                ) : !planet.isPlayer && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openSpyModal(pos)}
                                            className="w-8 h-8 rounded bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-[#929bc9] flex items-center justify-center border border-white/5 transition-colors" title="Szpieguj"
                                        >
                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                        </button>
                                        <button className="w-8 h-8 rounded bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-[#929bc9] flex items-center justify-center border border-white/5 transition-colors" title="Atakuj (Dostępne w Centrum Floty)">
                                            <span className="material-symbols-outlined text-lg">swords</span>
                                        </button>
                                        <button className="w-8 h-8 rounded bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-[#929bc9] flex items-center justify-center border border-white/5 transition-colors" title="Transportuj">
                                            <span className="material-symbols-outlined text-lg">local_shipping</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Spy Launch Modal */}
            {spyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1c2136] w-full max-w-sm rounded-xl border border-purple-500/50 shadow-2xl p-6 relative">
                        <button onClick={() => setSpyModal(null)} className="absolute top-4 right-4 text-[#929bc9] hover:text-white">
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                            <span className="material-symbols-outlined text-purple-400 text-3xl">visibility</span>
                            <div>
                                <h3 className="text-xl font-bold text-white">Wyślij Sondy</h3>
                                <p className="text-xs text-[#929bc9]">Cel: {spyModal.name} [{coords.galaxy}:{coords.system}:{spyModal.pos}]</p>
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
            )}

            {/* Espionage Report Modal */}
            {spyReport && (
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
            )}
        </div>
    );
};

export default Galaxy;
