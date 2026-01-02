
import React, { useState, useEffect } from 'react';
import { useGame } from '../GameContext';
import { RESEARCH, BUILDINGS, formatTime } from '../constants';
import { BuildingId, ResearchId } from '../types';

const Research: React.FC = () => {
    const { research, buildings, resources, upgradeResearch, getCost, constructionQueue, checkRequirements } = useGame();
    const [timeLeft, setTimeLeft] = useState('');

    const researchList = Object.values(RESEARCH);
    const labLevel = buildings[BuildingId.RESEARCH_LAB];
    const activeResearch = constructionQueue.find(q => q.type === 'research');
    const GAME_SPEED = 100; // Must match Context

    useEffect(() => {
        if (!activeResearch) {
            setTimeLeft('');
            return;
        }
        const tick = () => {
            const now = Date.now();
            const diff = Math.max(0, Math.floor((activeResearch.endTime - now) / 1000));
            setTimeLeft(formatTime(diff));
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [activeResearch]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-purple-400">science</span>
                    Badania
                </h2>
                <div className="flex gap-2">
                    {activeResearch ? (
                        <div className="bg-purple-900/30 border border-purple-500/30 px-3 py-1 rounded text-xs text-purple-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                            Badanie w toku: {timeLeft}
                        </div>
                    ) : (
                        <span className="text-sm text-[#929bc9]">Laboratorium: Lvl {labLevel}</span>
                    )}
                </div>
            </div>

            {labLevel === 0 ? (
                <div className="bg-[#1c2136] border border-red-500/20 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4">
                    <span className="material-symbols-outlined text-5xl text-red-500/50">block</span>
                    <h3 className="text-xl font-bold text-white">Laboratorium Badawcze Wymagane</h3>
                    <p className="text-[#929bc9]">Musisz wybudować Laboratorium Badawcze w menu Budynki, aby rozpocząć badania nad nowymi technologiami.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {researchList.map((item) => {
                        const level = research[item.id];
                        const cost = getCost('research', item.id, level);
                        const canAfford =
                            resources.metal >= cost.metal &&
                            resources.crystal >= cost.crystal &&
                            resources.deuterium >= cost.deuterium;

                        const isResearchingThis = activeResearch?.itemId === item.id;
                        const isBusy = !!activeResearch;
                        const isUnlocked = checkRequirements(item.requirements);

                        const totalRes = cost.metal + cost.crystal;
                        const buildTimeMs = ((totalRes / 1000) * 3600 * 1000) / (labLevel + 1) / GAME_SPEED;
                        const buildTimeSeconds = Math.max(1, Math.floor(buildTimeMs / 1000));

                        const getBonusInfo = (id: ResearchId, lvl: number) => {
                            if (id === ResearchId.WEAPON_TECH) {
                                return { text: `Atak: +${lvl * 10}% -> +${(lvl + 1) * 10}%`, type: 'combat', color: 'text-red-400' };
                            }
                            if (id === ResearchId.SHIELDING_TECH) {
                                return { text: `Tarcza: +${lvl * 5}% -> +${(lvl + 1) * 5}%`, type: 'combat', color: 'text-blue-400' };
                            }
                            if (id === ResearchId.ARMOUR_TECH) {
                                return { text: `Pancerz: +${lvl * 5}% -> +${(lvl + 1) * 5}%`, type: 'combat', color: 'text-emerald-400' };
                            }
                            if (id === ResearchId.ENERGY_TECH) {
                                return { text: `Reaktor: +${lvl * 1}% efektywności`, type: 'eco', color: 'text-yellow-400' };
                            }
                            if (id === ResearchId.ASTROPHYSICS) {
                                return { text: `Ekspedycje: +${lvl}`, type: 'eco', color: 'text-purple-400' };
                            }
                            return null;
                        };
                        const bonusInfo = getBonusInfo(item.id, level);

                        return (
                            <div key={item.id} className={`bg-[#1c2136] rounded-xl border border-white/10 overflow-hidden hover:border-purple-500/50 transition-all group flex flex-col h-full ${!isUnlocked ? 'opacity-60 grayscale' : ''}`}>
                                <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url("${item.image}")` }}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1c2136] to-transparent mix-blend-multiply"></div>
                                    <div className="absolute inset-0 bg-purple-900/10"></div>

                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-purple-300 border border-purple-500/30 font-mono">
                                        Lvl {level}
                                    </div>
                                    {isResearchingThis && (
                                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm p-4 text-center">
                                            <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg mb-2">
                                                Badanie...
                                            </div>
                                            <div className="text-2xl font-mono font-bold text-white">{timeLeft}</div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 flex flex-col flex-1">
                                    <h4 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">{item.name}</h4>
                                    <p className="text-xs text-[#929bc9] mb-4 line-clamp-2 min-h-[32px]">{item.description}</p>

                                    {bonusInfo && (
                                        <div className={`mb-3 text-[10px] font-bold uppercase tracking-wider ${bonusInfo.color}`}>
                                            {bonusInfo.text}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                                        <div className={`flex items-center gap-1 ${resources.metal < cost.metal ? 'text-red-400' : 'text-[#929bc9]'}`}>
                                            <span className="material-symbols-outlined text-[14px]">handyman</span>
                                            {cost.metal >= 1000 ? `${(cost.metal / 1000).toFixed(1)}k` : cost.metal}
                                        </div>
                                        <div className={`flex items-center gap-1 ${resources.crystal < cost.crystal ? 'text-red-400' : 'text-[#929bc9]'}`}>
                                            <span className="material-symbols-outlined text-[14px]">diamond</span>
                                            {cost.crystal >= 1000 ? `${(cost.crystal / 1000).toFixed(1)}k` : cost.crystal}
                                        </div>
                                        <div className={`flex items-center gap-1 ${resources.deuterium < cost.deuterium ? 'text-red-400' : 'text-[#929bc9]'}`}>
                                            <span className="material-symbols-outlined text-[14px]">propane</span>
                                            {cost.deuterium >= 1000 ? `${(cost.deuterium / 1000).toFixed(1)}k` : cost.deuterium}
                                        </div>
                                    </div>

                                    {isUnlocked ? (
                                        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                                            <span className="text-xs text-[#929bc9] flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                {formatTime(buildTimeSeconds)}
                                            </span>

                                            <button
                                                onClick={() => upgradeResearch(item.id)}
                                                disabled={!canAfford || isBusy}
                                                className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all shadow-lg
                                                    ${!canAfford || isBusy
                                                        ? 'bg-[#232948] text-[#929bc9]/50 cursor-not-allowed'
                                                        : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-purple-500/30'
                                                    }
                                                `}
                                            >
                                                {isResearchingThis ? 'Badanie...' : (canAfford ? 'Badaj' : 'Braki')}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-auto pt-3 border-t border-red-500/20">
                                            <p className="text-red-400 text-xs font-bold mb-1">Wymagania:</p>
                                            <div className="flex flex-col gap-1">
                                                {item.requirements?.map((req, i) => {
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
            )}
        </div>
    );
};

export default Research;