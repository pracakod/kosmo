
import React, { useState } from 'react';
import { useGame } from '../GameContext';
import { DEFENSES } from '../constants';
import { DefenseId } from '../types';

const DEFENSE_LIST = Object.values(DEFENSES);

const Defense: React.FC = () => {
    const { resources, buildings, buildDefense, defenses, shipyardQueue } = useGame();
    const shipyardLevel = buildings?.shipyard || 0;

    // Local state for quantity inputs
    const [inputs, setInputs] = useState<Record<string, number>>({});

    const handleInputChange = (id: string, val: string) => {
        const num = parseInt(val, 10);
        if (!isNaN(num) && num >= 0) {
            setInputs(prev => ({ ...prev, [id]: num }));
        } else if (val === '') {
            setInputs(prev => ({ ...prev, [id]: 0 }));
        }
    };

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}m ${s}s`;
    };

    const defenseQueue = shipyardQueue.filter(item => item.type === 'defense');

    return (
        <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold mb-6 text-white tracking-widest uppercase border-b border-white/10 pb-4">
                <span className="text-primary">System</span> Obrony Planetarnej
            </h2>

            {/* Defense Summary Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {(() => {
                    let totalCount = 0;
                    let totalAttack = 0;
                    let totalShield = 0;

                    DEFENSE_LIST.forEach(def => {
                        const count = defenses[def.id as DefenseId] || 0;
                        if (count > 0) {
                            totalCount += count;
                            totalAttack += count * def.attack;
                            totalShield += count * def.defense;
                        }
                    });

                    return (
                        <>
                            <div className="bg-[#1c2136] p-4 rounded-xl border border-white/10 flex items-center gap-4 shadow-lg">
                                <div className="size-12 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl">shield</span>
                                </div>
                                <div>
                                    <div className="text-[#929bc9] text-xs uppercase font-bold">Jednostki Obronne</div>
                                    <div className="text-white text-2xl font-mono font-bold">{totalCount}</div>
                                </div>
                            </div>

                            <div className="bg-[#1c2136] p-4 rounded-xl border border-white/10 flex items-center gap-4 shadow-lg">
                                <div className="size-12 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl">swords</span>
                                </div>
                                <div>
                                    <div className="text-[#929bc9] text-xs uppercase font-bold">Siła Ognia</div>
                                    <div className="text-white text-2xl font-mono font-bold">{totalAttack.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="bg-[#1c2136] p-4 rounded-xl border border-white/10 flex items-center gap-4 shadow-lg">
                                <div className="size-12 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl">security</span>
                                </div>
                                <div>
                                    <div className="text-[#929bc9] text-xs uppercase font-bold">Wytrzymałość Tarcz</div>
                                    <div className="text-white text-2xl font-mono font-bold">{totalShield.toLocaleString()}</div>
                                </div>
                            </div>
                        </>
                    );
                })()}
            </div>

            {shipyardLevel < 1 ? (
                <div className="bg-[#1c2136] rounded-xl border border-yellow-500/30 p-8 text-center">
                    <span className="material-symbols-outlined text-yellow-500 text-5xl mb-4">construction</span>
                    <h3 className="text-xl font-bold text-white mb-2">Wymagana Stocznia</h3>
                    <p className="text-[#929bc9]">Zbuduj Stocznię (poziom 1), aby odblokować systemy obronne.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Defense Grid */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {DEFENSE_LIST.map((def) => {
                            const canAfford = resources.metal >= def.cost.metal && resources.crystal >= def.cost.crystal && resources.deuterium >= def.cost.deuterium;
                            const currentAmount = defenses[def.id as DefenseId] || 0;
                            const buildTime = Math.floor((def.buildTime * 1000) / (shipyardLevel + 1) / 100 / 1000); // Correct formula from Context (GAME_SPEED assumed 100)

                            return (
                                <div key={def.id} className="bg-[#1c2136] rounded-xl border border-white/5 p-4 hover:border-primary/30 transition-all group relative overflow-hidden">
                                    {/* Amount Badge */}
                                    <div className="absolute top-2 right-2 bg-[#111422]/80 backdrop-blur-sm border border-white/10 px-2 py-1 rounded text-xs text-white font-mono z-10">
                                        Ilość: <span className="text-primary font-bold">{currentAmount}</span>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="size-16 rounded-xl bg-[#111422] flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors shrink-0">
                                            <span className="material-symbols-outlined text-primary text-3xl">{def.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-bold mb-1 truncate">{def.name}</h3>
                                            <p className="text-[#929bc9] text-[10px] mb-2 leading-tight h-8 overflow-hidden">{def.desc}</p>

                                            <div className="flex gap-2 text-[10px] mb-2">
                                                <div className="flex items-center gap-1 bg-red-500/10 px-1.5 py-0.5 rounded text-red-400">
                                                    <span className="material-symbols-outlined text-[10px]">swords</span>
                                                    <span>{def.attack}</span>
                                                </div>
                                                <div className="flex items-center gap-1 bg-blue-500/10 px-1.5 py-0.5 rounded text-blue-400">
                                                    <span className="material-symbols-outlined text-[10px]">shield</span>
                                                    <span>{def.defense}</span>
                                                </div>
                                                <div className="flex items-center gap-1 bg-gray-500/10 px-1.5 py-0.5 rounded text-gray-400">
                                                    <span className="material-symbols-outlined text-[10px]">timer</span>
                                                    <span>{formatTime(buildTime)}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1 text-[10px] mb-3">
                                                <span className={`px-1.5 py-0.5 rounded ${resources.metal >= def.cost.metal ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    M: {def.cost.metal.toLocaleString()}
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded ${resources.crystal >= def.cost.crystal ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    C: {def.cost.crystal.toLocaleString()}
                                                </span>
                                                {def.cost.deuterium > 0 && (
                                                    <span className={`px-1.5 py-0.5 rounded ${resources.deuterium >= def.cost.deuterium ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                        D: {def.cost.deuterium.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>

                                            {(() => {
                                                const amountToBuild = inputs[def.id] || 0;
                                                const totalCost = {
                                                    metal: def.cost.metal * (amountToBuild || 1),
                                                    crystal: def.cost.crystal * (amountToBuild || 1),
                                                    deuterium: def.cost.deuterium * (amountToBuild || 1)
                                                };
                                                const canAffordTotal = resources.metal >= totalCost.metal && resources.crystal >= totalCost.crystal && resources.deuterium >= totalCost.deuterium;

                                                return (
                                                    <div className="flex items-center gap-1">
                                                        <div className="flex items-center bg-[#111422] rounded border border-white/10 overflow-hidden">
                                                            <button
                                                                onClick={() => handleInputChange(def.id, Math.max(0, amountToBuild - 1).toString())}
                                                                className="w-7 h-7 flex items-center justify-center text-[#929bc9] hover:text-white hover:bg-white/5"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">remove</span>
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="0"
                                                                value={inputs[def.id] > 0 ? inputs[def.id] : ''}
                                                                onChange={(e) => handleInputChange(def.id, e.target.value)}
                                                                onFocus={(e) => e.target.select()}
                                                                className="w-10 bg-transparent text-white text-xs text-center focus:outline-none font-mono font-bold"
                                                            />
                                                            <button
                                                                onClick={() => handleInputChange(def.id, (amountToBuild + 1).toString())}
                                                                className="w-7 h-7 flex items-center justify-center text-[#929bc9] hover:text-white hover:bg-white/5"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">add</span>
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const maxMetal = Math.floor(resources.metal / def.cost.metal);
                                                                const maxCrystal = def.cost.crystal > 0 ? Math.floor(resources.crystal / def.cost.crystal) : Infinity;
                                                                const maxDeuterium = def.cost.deuterium > 0 ? Math.floor(resources.deuterium / def.cost.deuterium) : Infinity;
                                                                const max = Math.min(maxMetal, maxCrystal, maxDeuterium);
                                                                handleInputChange(def.id, max.toString());
                                                            }}
                                                            className="h-7 px-2 rounded bg-[#232948] text-[#929bc9] text-[10px] font-bold uppercase border border-white/5 hover:bg-primary/20 hover:text-primary"
                                                        >
                                                            Max
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (amountToBuild > 0) {
                                                                    buildDefense(def.id as any, amountToBuild);
                                                                    setInputs(prev => ({ ...prev, [def.id]: 0 }));
                                                                }
                                                            }}
                                                            disabled={amountToBuild <= 0 || !canAffordTotal}
                                                            className={`flex-1 h-7 rounded font-bold text-[10px] uppercase transition-all flex items-center justify-center gap-1 ${amountToBuild > 0 && canAffordTotal ? 'bg-primary hover:bg-blue-600 text-white' : 'bg-[#111422] text-[#555a7a] cursor-not-allowed'}`}
                                                        >
                                                            <span className="material-symbols-outlined text-xs">build</span>
                                                            Buduj
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Column: Queue & Info */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Queue Panel */}
                        <div className="bg-[#1c2136] rounded-xl border border-white/5 p-4 flex flex-col h-fit">
                            <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <span className="material-symbols-outlined text-yellow-500 text-sm">pending_actions</span>
                                Kolejka Budowy ({defenseQueue.length})
                            </h3>

                            {defenseQueue.length === 0 ? (
                                <div className="text-[#555a7a] text-xs text-center py-4 italic">Brak zadań w kolejce.</div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    {defenseQueue.map((item, idx) => {
                                        const def = DEFENSES[item.itemId as keyof typeof DEFENSES];
                                        if (!def) return null; // Safety check
                                        return (
                                            <div key={item.id} className="bg-[#111422] p-2 rounded border border-white/5 flex items-center gap-2 relative overflow-hidden">
                                                {/* Progress Bar Background (Simple visual for first item) */}
                                                {idx === 0 && (
                                                    <div className="absolute bottom-0 left-0 h-0.5 bg-green-500 animate-pulse w-full"></div>
                                                )}

                                                <div className="size-8 rounded bg-[#1c2136] flex items-center justify-center text-primary">
                                                    <span className="material-symbols-outlined text-sm">{def?.icon || 'help'}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-white text-xs font-bold truncate">{def?.name || item.itemId}</span>
                                                        <span className="text-xs text-yellow-500">x{item.quantity}</span>
                                                    </div>
                                                    <div className="text-[10px] text-[#555a7a]">
                                                        {idx === 0 ? 'W trakcie...' : 'Oczekuje'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Info Panel */}
                        <div className="bg-[#1c2136]/50 rounded-xl border border-white/5 p-4">
                            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-400 text-sm">info</span>
                                Info
                            </h3>
                            <ul className="text-[#929bc9] text-[11px] space-y-1.5 list-disc pl-3">
                                <li><strong>Obrona</strong> jest kluczowa, by chronić surowce przed grabieżą.</li>
                                <li>Zniszczone jednostki mają <strong>70% szans</strong> na naprawę.</li>
                                <li>Czas budowy zależy od poziomu <strong>Stoczni</strong>.</li>
                                <li>Obrona nie zużywa deuteru do utrzymania.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Defense;
