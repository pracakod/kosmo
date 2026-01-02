import React, { useState, useEffect } from 'react';
import { useGame } from '../GameContext';
import { SHIPS, BUILDINGS, RESEARCH, DEFENSES, formatTime } from '../constants';
import { BuildingId, ResearchId, ShipId, DefenseId } from '../types';

const Shipyard: React.FC = () => {
    const { ships, resources, buildShip, checkRequirements, buildings, research, shipyardQueue } = useGame();
    const shipList = Object.values(SHIPS).sort((a, b) => {
        const costA = a.baseCost.metal + a.baseCost.crystal + a.baseCost.deuterium;
        const costB = b.baseCost.metal + b.baseCost.crystal + b.baseCost.deuterium;
        return costA - costB;
    });
    const shipyardLevel = buildings[BuildingId.SHIPYARD];

    // Local state for input values
    const [inputs, setInputs] = useState<Record<string, number>>({});
    const [timeLeft, setTimeLeft] = useState('');

    const activeJob = shipyardQueue[0];

    useEffect(() => {
        if (!activeJob) {
            setTimeLeft('');
            return;
        }
        const tick = () => {
            const now = Date.now();
            const diff = Math.max(0, Math.floor((activeJob.endTime - now) / 1000));
            setTimeLeft(formatTime(diff));
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [activeJob]);

    const handleInputChange = (id: string, val: string) => {
        const num = parseInt(val, 10);
        if (!isNaN(num) && num >= 0) {
            setInputs(prev => ({ ...prev, [id]: num }));
        } else if (val === '') {
            setInputs(prev => ({ ...prev, [id]: 0 }));
        }
    };

    const handleBuild = (ship: typeof shipList[0]) => {
        const amount = inputs[ship.id] || 0;
        if (amount > 0) {
            buildShip(ship.id, amount);
            setInputs(prev => ({ ...prev, [ship.id]: 0 }));
        }
    };

    if (shipyardLevel === 0) {
        return (
            <div className="bg-[#1c2136] border border-red-500/20 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 mt-8">
                <span className="material-symbols-outlined text-5xl text-red-500/50">rocket_launch</span>
                <h3 className="text-xl font-bold text-white">Stocznia Wymagana</h3>
                <p className="text-[#929bc9]">Musisz wybudować Stocznię w menu Budynki, aby rozpocząć budowę floty.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-primary">rocket_launch</span>
                    Stocznia
                </h2>
                <div className="flex items-center gap-4">
                    {activeJob ? (
                        <div className="bg-primary/20 border border-primary/30 px-3 py-1 rounded text-xs text-primary flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm animate-spin">settings</span>
                            Budowa: {SHIPS[activeJob.itemId as ShipId]?.name || activeJob.itemId} ({activeJob.quantity}) - {timeLeft}
                        </div>
                    ) : (
                        <span className="text-sm text-[#929bc9]">Oczekuję na rozkazy</span>
                    )}
                    <span className="text-sm text-[#929bc9] border-l border-white/10 pl-4">Lvl {shipyardLevel}</span>
                </div>
            </div>

            {/* Ship Queue Display */}
            {shipyardQueue.length > 0 && (
                <div className="bg-[#1c2136] border border-white/10 rounded-xl p-4 mb-4">
                    <h3 className="text-sm font-bold text-[#929bc9] uppercase mb-3">Kolejka Produkcyjna</h3>
                    <div className="flex flex-col gap-2">
                        {shipyardQueue.map((item, index) => (
                            <div key={item.id} className={`flex items-center justify-between p-2 rounded ${index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-[#111422] border border-white/5'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="text-xs font-mono text-[#929bc9] w-4">{index + 1}.</div>
                                    <div className="font-bold text-sm text-white">{SHIPS[item.itemId as ShipId]?.name || item.itemId}</div>
                                    <div className="text-xs text-[#929bc9]">x{item.quantity}</div>
                                </div>
                                <div className="text-xs font-mono text-white">
                                    {index === 0 ? timeLeft : formatTime(Math.floor((item.endTime - item.startTime) / 1000))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {shipList.map((ship) => {
                    const count = ships[ship.id];
                    const amountToBuild = inputs[ship.id] || 0;
                    const isUnlocked = checkRequirements(ship.requirements);

                    const totalCost = {
                        metal: ship.baseCost.metal * (amountToBuild || 1),
                        crystal: ship.baseCost.crystal * (amountToBuild || 1),
                        deuterium: ship.baseCost.deuterium * (amountToBuild || 1)
                    };

                    const canAffordTotal =
                        resources.metal >= totalCost.metal &&
                        resources.crystal >= totalCost.crystal &&
                        resources.deuterium >= totalCost.deuterium;

                    const singleBuildTimeMs = (ship.buildTime * 1000) / (shipyardLevel + 1); // Real seconds
                    const totalBuildTimeSeconds = Math.max(1, Math.floor((singleBuildTimeMs * (amountToBuild || 1)) / 1000));

                    return (
                        <div key={ship.id} className={`bg-[#1c2136] border border-white/10 rounded-xl overflow-hidden group hover:border-primary/50 transition-all duration-300 relative ${!isUnlocked ? 'opacity-50' : ''}`}>
                            <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-xs text-[#929bc9] border border-white/10">
                                Posiadasz: <span className="text-white font-bold">{count}</span>
                            </div>
                            <div className="h-40 lg:h-32 bg-cover bg-center relative" style={{ backgroundImage: `url("${ship.image}")` }}>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1c2136] to-transparent"></div>
                                {!isUnlocked && <div className="absolute inset-0 bg-black/50 backdrop-grayscale"></div>}
                            </div>

                            <div className="p-5 lg:p-3 relative">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-white text-xl font-bold">{ship.name}</h4>
                                    <div className="flex flex-col gap-1 text-[10px] items-end">
                                        <span className="bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 whitespace-nowrap min-w-[80px] text-center">Atak {ship.attack}</span>
                                        <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 whitespace-nowrap min-w-[80px] text-center">Obrona {ship.defense}</span>
                                        <span className="bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 whitespace-nowrap min-w-[80px] text-center">Ładowność {ship.capacity}</span>
                                    </div>
                                </div>
                                <p className="text-[#929bc9] text-xs mb-4 line-clamp-2 h-8">{ship.description}</p>

                                {ship.bonuses && Object.keys(ship.bonuses).length > 0 && (
                                    <div className="mb-3 text-[10px] text-[#929bc9]">
                                        <span className="font-bold text-white uppercase block mb-1">Silny przeciwko:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {Object.keys(ship.bonuses).map(targetId => (
                                                <span key={targetId} className="bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    {SHIPS[targetId as ShipId]?.name || DEFENSES[targetId as DefenseId]?.name || targetId}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isUnlocked ? (
                                    <>
                                        <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-[#111422] rounded-lg border border-white/5">
                                            <div className={`flex flex-col text-xs ${resources.metal < ship.baseCost.metal ? 'text-red-400' : 'text-[#929bc9]'}`}>
                                                <span className="uppercase text-[10px] tracking-wider">Metal</span>
                                                <span className="font-mono text-white">{ship.baseCost.metal.toLocaleString()}</span>
                                            </div>
                                            <div className={`flex flex-col text-xs ${resources.crystal < ship.baseCost.crystal ? 'text-red-400' : 'text-[#929bc9]'}`}>
                                                <span className="uppercase text-[10px] tracking-wider">Kryształ</span>
                                                <span className="font-mono text-white">{ship.baseCost.crystal.toLocaleString()}</span>
                                            </div>
                                            <div className={`flex flex-col text-xs ${resources.deuterium < ship.baseCost.deuterium ? 'text-red-400' : 'text-[#929bc9]'}`}>
                                                <span className="uppercase text-[10px] tracking-wider">Deuter</span>
                                                <span className="font-mono text-white">{ship.baseCost.deuterium.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mb-3 text-xs text-[#929bc9]">
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {formatTime(totalBuildTimeSeconds)} (x{amountToBuild || 1})</span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-4">
                                            {/* Input Controls */}
                                            <div className="flex items-center bg-[#111422] rounded-lg border border-white/10 overflow-hidden shadow-sm">
                                                <button
                                                    onClick={() => handleInputChange(ship.id, Math.max(0, amountToBuild - 1).toString())}
                                                    className="w-10 h-10 flex items-center justify-center text-[#929bc9] hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors border-r border-white/5"
                                                >
                                                    <span className="material-symbols-outlined text-base">remove</span>
                                                </button>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    value={inputs[ship.id] > 0 ? inputs[ship.id] : ''}
                                                    onChange={(e) => handleInputChange(ship.id, e.target.value)}
                                                    className="w-16 bg-transparent text-white text-sm text-center focus:outline-none appearance-none font-mono font-bold"
                                                />
                                                <button
                                                    onClick={() => handleInputChange(ship.id, (amountToBuild + 1).toString())}
                                                    className="w-10 h-10 flex items-center justify-center text-[#929bc9] hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors border-l border-white/5"
                                                >
                                                    <span className="material-symbols-outlined text-base">add</span>
                                                </button>
                                            </div>

                                            {/* Max Button */}
                                            <button
                                                onClick={() => {
                                                    const maxMetal = Math.floor(resources.metal / ship.baseCost.metal);
                                                    const maxCrystal = ship.baseCost.crystal > 0 ? Math.floor(resources.crystal / ship.baseCost.crystal) : Infinity;
                                                    const maxDeuterium = ship.baseCost.deuterium > 0 ? Math.floor(resources.deuterium / ship.baseCost.deuterium) : Infinity;
                                                    const max = Math.min(maxMetal, maxCrystal, maxDeuterium);
                                                    handleInputChange(ship.id, max.toString());
                                                }}
                                                className="h-10 px-3 rounded-lg bg-[#232948] text-[#929bc9] text-xs font-bold uppercase border border-white/5 hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-all active:scale-95"
                                            >
                                                Max
                                            </button>

                                            {/* Build Button */}
                                            <button
                                                onClick={() => handleBuild(ship)}
                                                disabled={amountToBuild <= 0 || !canAffordTotal}
                                                className={`flex-1 h-10 rounded-lg text-sm font-bold uppercase transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95
                                                ${amountToBuild > 0 && canAffordTotal
                                                        ? 'bg-primary hover:bg-blue-600 text-white shadow-primary/20'
                                                        : 'bg-[#232948] text-[#929bc9] cursor-not-allowed opacity-50'
                                                    }
                                            `}
                                            >
                                                <span className="material-symbols-outlined text-lg">precision_manufacturing</span>
                                                <span>Produkuj</span>
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <p className="text-red-400 text-xs font-bold mb-1">Wymagane technologie:</p>
                                        <div className="flex flex-col gap-1">
                                            {ship.requirements?.map((req, i) => {
                                                const name = req.type === 'building' ? BUILDINGS[req.id as BuildingId].name : RESEARCH[req.id as ResearchId].name;
                                                const current = req.type === 'building' ? buildings[req.id as BuildingId] : research[req.id as ResearchId];
                                                return (
                                                    <div key={i} className={`text-xs ${current >= req.level ? 'text-green-400' : 'text-red-400/70'}`}>
                                                        - {name} (Lvl {req.level})
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Shipyard;