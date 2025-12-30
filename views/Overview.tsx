import React, { useEffect, useState } from 'react';
import { useGame } from '../GameContext';
import { IMAGES, PLANET_IMAGES, formatTime, SHIPS, DEFENSES } from '../constants';
import { ShipId } from '../types';

const Overview: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
    const { constructionQueue, buildings, ships, resources, shipyardQueue, planetName, renamePlanet, planetType, galaxyCoords, incomingMissions, activeMissions, productionSettings, getLevel, cancelMission } = useGame();
    const planetImage = planetType && PLANET_IMAGES[planetType] ? PLANET_IMAGES[planetType] : PLANET_IMAGES.default;
    const activeShipBuild = shipyardQueue[0];
    const [queueTimes, setQueueTimes] = useState<Record<string, string>>({});
    const [shipTimeLeft, setShipTimeLeft] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(planetName);

    useEffect(() => {
        setTempName(planetName);
    }, [planetName]);

    useEffect(() => {
        const tick = () => {
            const now = Date.now();

            const newTimes: Record<string, string> = {};
            constructionQueue.forEach(item => {
                const diff = Math.max(0, Math.floor((item.endTime - now) / 1000));
                newTimes[item.id] = formatTime(diff);
            });
            setQueueTimes(newTimes);

            if (activeShipBuild) {
                const diff = Math.max(0, Math.floor((activeShipBuild.endTime - now) / 1000));
                setShipTimeLeft(formatTime(diff));
            } else {
                setShipTimeLeft('');
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [constructionQueue, activeShipBuild]);

    const handleSaveName = () => {
        if (tempName.trim().length > 0) {
            renamePlanet(tempName.trim());
        } else {
            setTempName(planetName); // Revert if empty
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveName();
        } else if (e.key === 'Escape') {
            setTempName(planetName);
            setIsEditing(false);
        }
    };

    const totalShips = Object.values(ships).reduce((a: number, b: number) => a + b, 0);

    return (
        <div className="space-y-6">
            {/* Incoming Attack Alert */}
            {incomingMissions.length > 0 && (
                <div className="bg-red-900/50 border border-red-500 rounded-xl p-4 flex items-center justify-between animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500 text-3xl">warning</span>
                        <div>
                            <h3 className="text-red-400 font-bold text-lg">WYKRYTO ZAGROŻENIE!</h3>
                            <p className="text-red-200 text-sm">Nadciąga wroga flota! Szacowany czas kontaktu: {formatTime(Math.max(0, (incomingMissions[0].arrivalTime - Date.now()) / 1000))}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Planet Card */}
                <div className="lg:col-span-5 xl:col-span-4">
                    <div className="bg-[#161b2e] rounded-2xl overflow-hidden border border-white/10 shadow-xl relative group">
                        <div className="relative h-48 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#161b2e] via-transparent to-transparent z-10"></div>
                            <img src={planetImage} alt="Planet" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 opacity-80" />

                            {/* Coordinates Badge */}
                            <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
                                <div className="flex items-center gap-2 text-[#929bc9] text-sm bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-sm">my_location</span>
                                    [{galaxyCoords?.galaxy || 1}:{galaxyCoords?.system || 1}:{galaxyCoords?.position || 1}]
                                </div>
                            </div>

                            <div className="absolute bottom-4 left-4 w-full pr-8 z-20">
                                <div className="flex items-center gap-2 h-10">
                                    {isEditing ? (
                                        <div className="flex items-center gap-2 bg-black/60 rounded p-1 backdrop-blur-md">
                                            <input
                                                autoFocus
                                                value={tempName}
                                                onChange={(e) => setTempName(e.target.value)}
                                                onBlur={handleSaveName}
                                                onKeyDown={handleKeyDown}
                                                className="bg-transparent border-b border-primary text-white font-bold text-xl w-32 focus:outline-none"
                                            />
                                            <button onClick={handleSaveName} className="text-green-400 hover:text-green-300">
                                                <span className="material-symbols-outlined text-lg">check</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <h2 className="text-3xl font-bold text-white mb-1 truncate shadow-black drop-shadow-md">{planetName}</h2>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-colors"
                                                title="Zmień nazwę"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                <span className="text-[#929bc9] text-sm">Średnica</span>
                                <span className="text-white font-medium">12,800 km</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                <span className="text-[#929bc9] text-sm">Temperatura</span>
                                <span className="text-white font-medium">12°C do 50°C</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#929bc9] text-sm">Zabudowa</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{(Object.values(buildings) as number[]).reduce((a, b) => a + b, 0)} / 163</span>
                                </div>
                            </div>
                        </div>

                        {/* Player Stats Card - inside planet section */}
                        <div className="p-4 border-t border-white/10">
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-lg">person</span>
                                Statystyki Dowódcy
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#111422] rounded-lg p-3 text-center">
                                    <div className="text-yellow-400 font-bold text-2xl">
                                        {(() => {
                                            const resPoints = Math.floor(((resources.metal || 0) + (resources.crystal || 0) + (resources.deuterium || 0)) / 1000);
                                            const buildPoints = Object.values(buildings).reduce((a, b) => a + (b || 0) * 100, 0);
                                            const shipPoints = Object.values(ships).reduce((a, b) => a + (b || 0) * 50, 0);
                                            const totalPoints = resPoints + buildPoints + shipPoints;
                                            // FIX: Use getLevel to respect Level 16 Lock
                                            return getLevel ? getLevel(totalPoints, productionSettings) : (Math.floor(totalPoints / 1000) + 1);
                                        })()}
                                    </div>
                                    <div className="text-[#929bc9] text-xs uppercase">Poziom</div>
                                </div>
                                <div className="bg-[#111422] rounded-lg p-3 text-center">
                                    <div className="text-primary font-bold text-2xl">{totalShips}</div>
                                    <div className="text-[#929bc9] text-xs uppercase">Flota</div>
                                </div>
                                <div className="bg-[#111422] rounded-lg p-3 text-center">
                                    <div className="text-green-400 font-bold text-lg">~2-5k</div>
                                    <div className="text-[#929bc9] text-xs uppercase">Zysk/Exp.</div>
                                </div>
                                <div className="bg-[#111422] rounded-lg p-3 text-center">
                                    <div className="text-purple-400 font-bold text-lg">{activeMissions.length}</div>
                                    <div className="text-[#929bc9] text-xs uppercase">Aktywne Misje</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Construction Queue & Status */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold tracking-tight">Status Operacyjny</h3>
                    </div>

                    {/* Building Queue */}
                    {constructionQueue.length > 0 ? (
                        <div className="space-y-4">
                            {constructionQueue.map((item, index) => {
                                const isNext = index === 0; // First item is always active/next
                                return (
                                    <div key={item.id} className={`bg-[#232948] border ${isNext ? 'border-primary/50' : 'border-white/10'} rounded-xl p-4 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group shadow-[0_0_15px_rgba(19,55,236,0.1)]`}>
                                        {isNext && <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary animate-pulse"></div>}
                                        <div className="size-16 rounded-xl bg-[#111422] shrink-0 flex items-center justify-center border border-white/10">
                                            <span className={`material-symbols-outlined text-3xl ${isNext ? 'text-primary animate-spin-slow' : 'text-[#929bc9]'}`} style={{ animationDuration: '3s' }}>construction</span>
                                        </div>
                                        <div className="flex-1 min-w-0 w-full text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                                <h4 className="text-white font-bold text-lg truncate flex items-center gap-2">
                                                    {isNext ? 'Rozbudowa w toku' : 'W kolejce'}
                                                    {!isNext && <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-[#929bc9]">#{index + 1}</span>}
                                                </h4>
                                                <span className="px-2 py-0.5 rounded text-xs bg-primary/20 text-primary border border-primary/20 font-bold">Lvl {item.targetLevel}</span>
                                            </div>
                                            <div className="flex items-center gap-4 justify-center md:justify-start text-sm text-[#929bc9]">
                                                <span className={isNext ? "text-primary font-medium animate-pulse" : ""}>{isNext ? 'Pozostały czas:' : 'Start za:'}</span>
                                                <span className={`text-2xl font-mono ${isNext ? 'text-white font-bold' : 'text-[#929bc9]'}`}>
                                                    {queueTimes[item.id] || '...'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-[#1c2136] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-center h-28">
                            <p className="text-[#929bc9] text-sm">Brak aktywnych procesów budowy.</p>
                            <button onClick={() => onNavigate('buildings')} className="text-primary hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">Rozpocznij budowę &rarr;</button>
                        </div>
                    )}

                    {/* Shipyard Queue */}
                    {/* Shipyard Queue */}
                    {activeShipBuild ? (
                        (() => {
                            const isDefense = activeShipBuild.type === 'defense';
                            // @ts-ignore
                            const itemDef = isDefense ? DEFENSES[activeShipBuild.itemId] : SHIPS[activeShipBuild.itemId as ShipId];
                            const itemName = itemDef?.name || activeShipBuild.itemId;
                            // @ts-ignore
                            const itemIcon = itemDef?.icon || (isDefense ? 'shield' : 'rocket');

                            return (
                                <div className="bg-[#2a2d40] border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${isDefense ? 'bg-blue-500' : 'bg-orange-500'} animate-pulse`}></div>
                                    <div className="size-20 rounded-xl bg-[#111422] shrink-0 flex items-center justify-center border border-white/10">
                                        <span className={`material-symbols-outlined text-4xl ${isDefense ? 'text-blue-500' : 'text-orange-500'} animate-pulse`}>{itemIcon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0 w-full text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                            <h4 className="text-white font-bold text-xl truncate">{isDefense ? 'Budowa Obrony' : 'Produkcja Floty'}</h4>
                                            <span className={`px-2 py-0.5 rounded text-xs ${isDefense ? 'bg-blue-500/20 text-blue-500 border-blue-500/20' : 'bg-orange-500/20 text-orange-500 border-orange-500/20'} border font-bold`}>
                                                {itemName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 justify-center md:justify-start text-sm text-[#929bc9]">
                                            <span className={`${isDefense ? 'text-blue-500' : 'text-orange-500'} font-medium`}>x{activeShipBuild.quantity}</span>
                                            <span className="text-2xl font-mono text-white font-bold">{shipTimeLeft}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    ) : null}
                </div>
            </div>

            <div className="bg-[#1c2136] rounded-xl border border-white/10 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">rocket_launch</span>
                    Status Floty
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#111422] p-4 rounded-lg border border-white/5">
                        <div className="text-[#929bc9] text-xs uppercase font-bold mb-1">Jednostki Bojowe</div>
                        <div className="text-2xl text-white font-mono">{totalShips}</div>
                    </div>
                    <div className="bg-[#111422] p-4 rounded-lg border border-white/5">
                        <div className="text-[#929bc9] text-xs uppercase font-bold mb-1">Gotowość Bojowa</div>
                        <div className="text-2xl text-green-400 font-mono">100%</div>
                    </div>
                    <div className="bg-[#111422] p-4 rounded-lg border border-white/5">
                        <div className="text-[#929bc9] text-xs uppercase font-bold mb-1">Misje w toku</div>
                        <div className="text-2xl text-white font-mono">0 / 2</div>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={() => onNavigate('shipyard')} className="text-primary text-sm font-bold hover:text-white transition-colors">Do Stoczni &rarr;</button>
                </div>
            </div>

            {/* Active Missions List */}
            <div className="bg-[#1c2136] rounded-xl border border-white/10 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">radar</span>
                    Aktywne Misje
                </h3>
                {activeMissions.length === 0 ? (
                    <p className="text-[#929bc9] text-sm text-center py-4">Brak aktywnych misji.</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {activeMissions.map((mission) => {
                            const isReturn = mission.status === 'returning';
                            const dest = mission.targetCoords;
                            const missionName = mission.type === 'attack' ? 'Atak' : (mission.type === 'spy' ? 'Szpiegowanie' : (mission.type === 'expedition' ? 'Ekspedycja' : 'Misja'));

                            return (
                                <div key={mission.id} className="bg-[#111422] p-4 rounded-lg border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isReturn ? 'bg-blue-500/20 text-blue-400' : (mission.type === 'attack' ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400')}`}>
                                            <span className="material-symbols-outlined">{isReturn ? 'keyboard_return' : (mission.type === 'attack' ? 'swords' : 'visibility')}</span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{isReturn ? `Powrót z ${missionName}` : missionName}</div>
                                            <div className="text-xs text-[#929bc9]">Cel: [{dest.galaxy}:{dest.system}:{dest.position}]</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-xs text-[#929bc9]">Czas do celu</div>
                                            <div className="font-mono text-white font-bold">
                                                {formatTime(Math.max(0, ((isReturn ? mission.returnTime : mission.arrivalTime) - Date.now()) / 1000))}
                                            </div>
                                        </div>
                                        {mission.status === 'flying' && (
                                            <button
                                                onClick={() => cancelMission(mission.id)}
                                                className="px-3 py-1 bg-red-900/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 rounded text-sm transition-colors uppercase font-bold tracking-wider"
                                            >
                                                Odwołaj
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Overview;