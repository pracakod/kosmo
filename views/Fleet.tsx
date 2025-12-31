
import React, { useState, useEffect } from 'react';
import { useGame } from '../GameContext';
import { SHIPS, DEFENSES, formatTime } from '../constants';
import { ShipId, MissionType, FleetMission, DefenseId } from '../types';
import Logbook from '../components/Logbook';

const Fleet: React.FC = () => {
    const { ships, sendExpedition, sendAttack, activeMissions, missionLogs, clearLogs, cancelMission } = useGame();
    // const [selectedReport, setSelectedReport] = useState<any>(null); // Moved to Logbook

    // Selection State
    const [selectedShips, setSelectedShips] = useState<Record<string, number>>({});
    const [coords, setCoords] = useState({ galaxy: 1, system: 1, position: 2 }); // Default to Pirate Base
    const [missionType, setMissionType] = useState<MissionType>(MissionType.ATTACK);

    // Helper to calculate total capacity/speed/etc if we wanted to show it
    const getSelectedCount = (id: string) => selectedShips[id] || 0;

    const handleSelectShip = (id: string, val: string) => {
        const available = ships[id as ShipId] || 0;
        let num = parseInt(val, 10);
        if (isNaN(num)) num = 0;
        num = Math.min(Math.max(0, num), available);

        setSelectedShips(prev => ({ ...prev, [id]: num }));
    };

    const updateShipCount = (id: string, delta: number) => {
        const current = getSelectedCount(id);
        const available = ships[id as ShipId] || 0;
        const newCount = Math.min(Math.max(0, current + delta), available);
        setSelectedShips(prev => ({ ...prev, [id]: newCount }));
    };

    const handleMax = (id: string) => {
        const available = ships[id as ShipId] || 0;
        setSelectedShips(prev => ({ ...prev, [id]: available }));
    };

    const handleSelectAll = () => {
        const all: Record<string, number> = {};
        Object.entries(ships).forEach(([id, count]) => {
            const numCount = count as number;
            if (numCount > 0) {
                all[id] = numCount;
            }
        });
        setSelectedShips(all);
    };

    const handleLaunch = () => {
        // Filter out 0s
        const payload: Record<string, number> = {};
        let total = 0;
        Object.entries(selectedShips).forEach(([id, c]) => {
            const count = c as number;
            if (count > 0) {
                payload[id] = count;
                total += count;
            }
        });

        if (total === 0) return;

        if (missionType === MissionType.EXPEDITION) {
            sendExpedition(payload as Record<ShipId, number>, coords);
        } else if (missionType === MissionType.ATTACK) {
            sendAttack(payload as Record<ShipId, number>, coords);
        }

        // Reset inputs
        setSelectedShips({});
    };

    const totalSelected = (Object.values(selectedShips) as number[]).reduce((a, b) => a + b, 0);

    const totalCapacity = Object.entries(selectedShips).reduce((acc, [id, count]) => {
        return acc + (SHIPS[id as ShipId].capacity * (count as number));
    }, 0);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-primary">flight_takeoff</span>
                    Centrum Floty
                </h2>
                <div className="flex gap-4 text-sm text-[#929bc9]">
                    <span>Misje: {activeMissions.length} / 2</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Col: Ship Selector */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Fleet Stats Dashboard */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(() => {
                            let totalCount = 0;
                            let firePower = 0;
                            let defensePower = 0;
                            let totalCap = 0;

                            Object.entries(ships).forEach(([id, count]) => {
                                const def = SHIPS[id as ShipId];
                                if (count > 0 && def) {
                                    totalCount += count;
                                    firePower += count * def.attack;
                                    defensePower += count * def.defense;
                                    totalCap += count * def.capacity;
                                }
                            });

                            return (
                                <>
                                    <div className="bg-[#1c2136] p-4 rounded-xl border border-white/10 shadow-lg">
                                        <div className="text-[#929bc9] text-[10px] uppercase font-bold mb-1">Liczebność Floty</div>
                                        <div className="text-white text-xl font-mono font-bold">{totalCount}</div>
                                    </div>
                                    <div className="bg-[#1c2136] p-4 rounded-xl border border-white/10 shadow-lg">
                                        <div className="text-[#929bc9] text-[10px] uppercase font-bold mb-1">Siła Ognia</div>
                                        <div className="text-red-400 text-xl font-mono font-bold">{firePower.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-[#1c2136] p-4 rounded-xl border border-white/10 shadow-lg">
                                        <div className="text-[#929bc9] text-[10px] uppercase font-bold mb-1">Wytrzymałość</div>
                                        <div className="text-green-400 text-xl font-mono font-bold">{defensePower.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-[#1c2136] p-4 rounded-xl border border-white/10 shadow-lg">
                                        <div className="text-[#929bc9] text-[10px] uppercase font-bold mb-1">Ładowność (Całk.)</div>
                                        <div className="text-blue-400 text-xl font-mono font-bold">{totalCap.toLocaleString()}</div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    <div className="bg-[#1c2136] rounded-xl border border-white/10 p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">rocket_launch</span>
                                Dostępna Flota
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={handleSelectAll} className="text-xs bg-primary/20 text-primary hover:bg-primary hover:text-white px-3 py-1 rounded font-bold transition-colors">Wybierz wszystkie</button>
                                <button onClick={() => setSelectedShips({})} className="text-xs text-[#929bc9] hover:text-white underline">Zeruj wybór</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(ships).map(([id, count]) => {
                                const shipDef = SHIPS[id as ShipId];
                                if (count <= 0) return null;

                                const isSelected = selectedShips[id as ShipId] > 0;

                                return (
                                    <div key={id} className={`p-4 rounded-xl border transition-all ${isSelected ? 'bg-primary/5 border-primary/30 shadow-lg shadow-primary/5' : 'bg-[#1c2136] border-white/5 hover:border-white/10'}`}>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-lg bg-[#111422] flex items-center justify-center border border-white/10 bg-cover bg-center" style={{ backgroundImage: `url(${shipDef.image})` }}>
                                                    {!shipDef.image && <span className="material-symbols-outlined text-primary text-2xl">rocket</span>}
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold">{shipDef.name}</h4>
                                                    <div className="flex gap-2 text-[10px] mt-1">
                                                        <span className="text-[#929bc9] bg-white/5 px-1.5 py-0.5 rounded">Dostępne: <span className="text-white font-mono">{count}</span></span>
                                                        <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Ład.: {(shipDef.capacity || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="text-[10px] text-[#555a7a] uppercase font-bold">Wybierz</div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={count}
                                                    value={selectedShips[id as ShipId] || ''}
                                                    onChange={(e) => handleSelectShip(id as ShipId, e.target.value)}
                                                    className="w-20 bg-[#111422] border border-white/10 rounded px-2 py-1 text-right text-white font-mono text-sm focus:border-primary focus:outline-none"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Quick Select Buttons */}
                                        <div className="grid grid-cols-4 gap-2">
                                            <button
                                                onClick={() => handleSelectShip(id as ShipId, "0")}
                                                className="h-8 text-[10px] uppercase font-bold text-[#555a7a] hover:text-white border border-white/5 hover:bg-white/5 rounded transition-colors"
                                            >
                                                0
                                            </button>
                                            <button
                                                onClick={() => handleSelectShip(id as ShipId, Math.max(0, Math.floor(count / 2)).toString())}
                                                className="h-8 text-[10px] uppercase font-bold text-[#929bc9] hover:text-white border border-white/5 hover:bg-white/5 rounded transition-colors"
                                            >
                                                50%
                                            </button>
                                            <button
                                                onClick={() => handleSelectShip(id as ShipId, count.toString())}
                                                className="col-span-2 h-8 text-[10px] uppercase font-bold text-primary hover:text-white border border-primary/20 hover:bg-primary/20 rounded transition-colors"
                                            >
                                                MAX ({count})
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {Object.values(ships).every(x => x === 0) && (
                                <div className="text-center py-8 text-[#929bc9]">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">sailing</span>
                                    <p>Brak statków w dokach. Wybuduj flotę w Stoczni.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Col: Target & Mission */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-[#1c2136] rounded-xl border border-white/10 p-6 shadow-lg">
                        <h3 className="text-xl font-bold text-white mb-4">Cel i Misja</h3>

                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-[#111422] rounded-lg border border-white/5">
                                <label className="text-xs text-[#929bc9] uppercase font-bold mb-3 block">Współrzędne Celu</label>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="flex flex-col items-center gap-1 w-20">
                                        <span className="text-[10px] text-[#555a7a] uppercase">Gal</span>
                                        <input type="number"
                                            value={coords.galaxy}
                                            onChange={e => setCoords({ ...coords, galaxy: parseInt(e.target.value) || 1 })}
                                            className="w-full bg-[#232948] text-center py-3 rounded-lg text-white font-mono font-bold border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <span className="text-white/20 text-xl font-light mt-4">:</span>
                                    <div className="flex flex-col items-center gap-1 w-20">
                                        <span className="text-[10px] text-[#555a7a] uppercase">Ukł</span>
                                        <input type="number"
                                            value={coords.system}
                                            onChange={e => setCoords({ ...coords, system: parseInt(e.target.value) || 1 })}
                                            className="w-full bg-[#232948] text-center py-3 rounded-lg text-white font-mono font-bold border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <span className="text-white/20 text-xl font-light mt-4">:</span>
                                    <div className="flex flex-col items-center gap-1 w-20">
                                        <span className="text-[10px] text-[#555a7a] uppercase">Poz</span>
                                        <input type="number"
                                            value={coords.position}
                                            onChange={e => setCoords({ ...coords, position: parseInt(e.target.value) || 1 })}
                                            className="w-full bg-[#232948] text-center py-3 rounded-lg text-white font-mono font-bold border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-center mt-3 gap-2">
                                    <button onClick={() => { setCoords({ ...coords, position: 16 }); setMissionType(MissionType.EXPEDITION) }} className={`text-xs px-2 py-1 rounded border border-transparent hover:border-white/10 transition-colors ${coords.position === 16 ? 'text-primary font-bold bg-primary/10' : 'text-[#929bc9] hover:text-white'}`}>
                                        [16] Głęboka Przestrzeń
                                    </button>
                                    <button onClick={() => { setCoords({ ...coords, position: 2 }); setMissionType(MissionType.ATTACK) }} className={`text-xs px-2 py-1 rounded border border-transparent hover:border-white/10 transition-colors ${coords.position === 2 ? 'text-red-400 font-bold bg-red-500/10' : 'text-[#929bc9] hover:text-white'}`}>
                                        [2] Baza Piratów
                                    </button>
                                </div>
                            </div>

                            {/* Fleet Summary / Capacity Display */}
                            {totalSelected > 0 && (
                                <div className="p-4 bg-[#111422] rounded-lg border border-white/5 flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[#929bc9]">Ilość Statków:</span>
                                        <span className="text-white font-mono">{totalSelected}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[#929bc9]">Całkowita Ładowność:</span>
                                        <span className="text-green-400 font-mono font-bold">{totalCapacity.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-[#111422] rounded-lg border border-white/5">
                                <label className="text-xs text-[#929bc9] uppercase font-bold mb-2 block">Typ Misji</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setMissionType(MissionType.EXPEDITION)}
                                        className={`flex-1 py-3 rounded-lg font-bold text-sm border transition-colors ${missionType === MissionType.EXPEDITION ? 'bg-primary text-white border-primary/50 shadow-lg shadow-primary/20' : 'bg-[#232948] text-[#929bc9] border-white/5'}`}
                                    >
                                        Ekspedycja
                                    </button>
                                    <button
                                        onClick={() => setMissionType(MissionType.ATTACK)}
                                        className={`flex-1 py-3 rounded-lg font-bold text-sm border transition-colors ${missionType === MissionType.ATTACK ? 'bg-red-500 text-white border-red-500/50 shadow-lg shadow-red-500/20' : 'bg-[#232948] text-[#929bc9] border-white/5'}`}
                                    >
                                        Atak
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleLaunch}
                                disabled={totalSelected === 0}
                                className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest transition-all shadow-xl
                                    ${totalSelected > 0
                                        ? missionType === MissionType.ATTACK
                                            ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white transform hover:scale-[1.02] shadow-red-900/30'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transform hover:scale-[1.02] shadow-blue-900/30'
                                        : 'bg-[#232948] text-white/20 cursor-not-allowed'
                                    }
                                `}
                            >
                                <div className="flex flex-col leading-none gap-1">
                                    <span>{missionType === MissionType.ATTACK ? 'ROZPOCZNIJ ATAK' : 'WYŚLIJ FLOTĘ'}</span>
                                    {totalSelected > 0 && <span className="text-[10px] font-normal opacity-70">Statków: {totalSelected}</span>}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Missions */}
            {activeMissions.length > 0 && (
                <div className="bg-[#1c2136] rounded-xl border border-white/10 p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4">Aktywne Misje</h3>
                    <div className="space-y-4">
                        {activeMissions.map(mission => (
                            <ActiveMissionItem key={mission.id} mission={mission} onCancel={cancelMission} />
                        ))}
                    </div>
                </div>
            )}

            {/* Logs / Logbook */}
            <Logbook />
        </div>
    );
};

// Sub-component for flight visualization
const ActiveMissionItem: React.FC<{ mission: FleetMission, onCancel: (id: string) => Promise<void> }> = ({ mission, onCancel }) => {
    const [status, setStatus] = useState<'outbound' | 'inbound'>('outbound');
    const [progress, setProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState('');
    const [canceling, setCanceling] = useState(false);

    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            let p = 0;
            let remaining = 0;

            if (now < mission.arrivalTime) {
                // Outbound Phase (0 -> 100% to arrival)
                setStatus('outbound');
                const totalDuration = mission.arrivalTime - mission.startTime;
                const elapsed = now - mission.startTime;
                p = Math.min(100, (elapsed / totalDuration) * 100);
                remaining = (mission.arrivalTime - now) / 1000;
            } else {
                // Inbound Phase (0 -> 100% from arrival to home)
                setStatus('inbound');
                const totalDuration = mission.returnTime - mission.arrivalTime;
                const elapsed = now - mission.arrivalTime;
                p = Math.min(100, (elapsed / totalDuration) * 100);
                remaining = (mission.returnTime - now) / 1000;
            }

            setProgress(p);
            setTimeLeft(formatTime(remaining));
        };
        tick();
        const interval = setInterval(tick, 100);
        return () => clearInterval(interval);
    }, [mission]);

    const isAttack = mission.type === MissionType.ATTACK;

    return (
        <div className={`rounded-lg p-4 border relative overflow-hidden ${isAttack ? 'bg-red-900/10 border-red-500/20' : 'bg-[#111422] border-white/5'}`}>

            {/* Flight Path Visualizer */}
            <div className="flex items-center justify-between mb-4 relative px-4 py-2">
                <div className="flex flex-col items-center z-10">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-blue-400">home</span>
                    </div>
                    <span className="text-[10px] text-[#929bc9] mt-1">Baza</span>
                </div>

                {/* The Line */}
                <div className="flex-1 h-1 bg-white/10 mx-2 relative rounded-full overflow-hidden">
                    {/* Progress Fill */}
                    <div
                        className={`h-full transition-all duration-100 ease-linear ${status === 'outbound' ? (isAttack ? 'bg-red-500 origin-left' : 'bg-primary origin-left') : 'bg-green-500 origin-right ml-auto'}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Ship Icon Moving */}
                <div
                    className="absolute top-1/2 -translate-y-[calc(50%+12px)] transition-all duration-100 ease-linear z-20"
                    style={{ left: `calc(10% + ${status === 'outbound' ? progress * 0.8 : (100 - progress) * 0.8}%)` }}
                >
                    <span className={`material-symbols-outlined text-white text-xl drop-shadow-lg transform ${status === 'inbound' ? 'rotate-180 text-green-400' : (isAttack ? 'text-red-500' : 'text-primary')}`}>
                        rocket
                    </span>
                </div>

                <div className="flex flex-col items-center z-10">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${status === 'inbound' ? 'bg-green-500/20 border-green-500' : (isAttack ? 'bg-red-500/20 border-red-500' : mission.type === 'transport' ? 'bg-blue-500/20 border-blue-500' : 'bg-white/5 border-white/20')}`}>
                        <span className={`material-symbols-outlined text-sm ${status === 'inbound' ? 'text-green-400' : (isAttack ? 'text-red-400' : mission.type === 'transport' ? 'text-blue-400' : 'text-[#929bc9]')}`}>
                            {isAttack ? 'swords' : mission.type === 'transport' ? 'local_shipping' : mission.type === 'spy' ? 'visibility' : 'public'}
                        </span>
                    </div>
                    <span className="text-[10px] text-[#929bc9] mt-1">
                        {isAttack ? 'Bitwa' : mission.type === 'transport' ? 'Transport' : mission.type === 'spy' ? 'Szpieg' : 'Ekspedycja'}
                    </span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5 pt-3">
                <div className="flex flex-col gap-1 w-full md:w-auto">
                    <div className="flex items-center gap-3">
                        <div className="text-white font-bold text-sm">Cel: [{mission.targetCoords.galaxy}:{mission.targetCoords.system}:{mission.targetCoords.position}]</div>
                        <div className="text-[#929bc9] text-xs">Flota: {Object.values(mission.ships).reduce((a: number, b: number) => a + Number(b), 0)} jedn.</div>
                    </div>

                    {/* Detailed Cargo/Ships View */}
                    <div className="text-[10px] text-[#555a7a] flex flex-wrap gap-2 mt-1">
                        {mission.type === 'transport' && mission.resources && (
                            <div className="flex gap-2 bg-[#0b0d17] px-2 py-1 rounded border border-white/5">
                                {mission.resources.metal > 0 && <span className="text-blue-400">M: {Math.floor(mission.resources.metal).toLocaleString()}</span>}
                                {mission.resources.crystal > 0 && <span className="text-purple-400">C: {Math.floor(mission.resources.crystal).toLocaleString()}</span>}
                                {mission.resources.deuterium > 0 && <span className="text-green-400">D: {Math.floor(mission.resources.deuterium).toLocaleString()}</span>}
                            </div>
                        )}
                        <div className="flex gap-2 bg-[#0b0d17] px-2 py-1 rounded border border-white/5 overflow-x-auto max-w-[300px] scrollbar-hide">
                            {Object.entries(mission.ships).map(([id, count]) => count > 0 && (
                                <span key={id} className="text-white whitespace-nowrap">{SHIPS[id as ShipId]?.name}: {count}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-right flex items-center gap-3 md:shrink-0">
                    <div>
                        <div className="text-white font-mono font-bold">{timeLeft}</div>
                        <div className={`text-xs animate-pulse ${status === 'outbound' ? (isAttack ? 'text-red-400' : 'text-primary') : 'text-green-400'}`}>
                            {status === 'outbound' ? (isAttack ? 'Atak w toku!' : 'Dolot do celu...') : 'Powrót do bazy...'}
                        </div>
                    </div>
                    {status === 'outbound' && (
                        <button
                            onClick={async () => {
                                setCanceling(true);
                                await onCancel(mission.id);
                                setCanceling(false);
                            }}
                            disabled={canceling}
                            className="px-3 py-2 text-xs font-bold uppercase rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-white transition-colors disabled:opacity-50"
                        >
                            {canceling ? 'Anulowanie...' : 'Odwołaj'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Fleet;
