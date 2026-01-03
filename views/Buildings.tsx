
import React, { useState, useEffect } from 'react';
import { useGame } from '../GameContext';
import { BUILDINGS, RESEARCH, formatTime } from '../constants';
import { BuildingId, ResearchId } from '../types';

const Buildings: React.FC = () => {
    const { buildings, research, resources, upgradeBuilding, getCost, constructionQueue, checkRequirements, productionSettings, updateProductionSetting } = useGame();
    const [timeLeft, setTimeLeft] = useState('');

    const buildingList = Object.values(BUILDINGS);
    const activeBuild = constructionQueue.find(q => q.type === 'building');
    const robotLevel = buildings[BuildingId.ROBOT_FACTORY] || 0;
    const GAME_SPEED = 100; // Must match Context

    useEffect(() => {
        if (!activeBuild) {
            setTimeLeft('');
            return;
        }
        const tick = () => {
            const now = Date.now();
            const diff = Math.max(0, Math.floor((activeBuild.endTime - now) / 1000));
            setTimeLeft(formatTime(diff));
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [activeBuild]);

    const getProductionInfo = (buildingId: BuildingId, currentLevel: number) => {
        // Simplified prediction logic purely for display purposes
        if (buildingId === BuildingId.METAL_MINE) {
            const current = Math.floor(30 * currentLevel * Math.pow(1.1, currentLevel)) * 100; // 100 is GAME_SPEED
            const next = Math.floor(30 * (currentLevel + 1) * Math.pow(1.1, currentLevel + 1)) * 100;
            const currentEnergy = Math.floor(20 * currentLevel * Math.pow(1.1, currentLevel));
            const nextEnergy = Math.floor(20 * (currentLevel + 1) * Math.pow(1.1, currentLevel + 1));
            return { text: `Produkcja: +${(next - current).toLocaleString()}/h`, energyText: `Energia: -${(nextEnergy - currentEnergy).toLocaleString()}`, type: 'gain' };
        }
        if (buildingId === BuildingId.CRYSTAL_MINE) {
            const current = Math.floor(20 * currentLevel * Math.pow(1.1, currentLevel)) * 100;
            const next = Math.floor(20 * (currentLevel + 1) * Math.pow(1.1, currentLevel + 1)) * 100;
            const currentEnergy = Math.floor(20 * currentLevel * Math.pow(1.1, currentLevel));
            const nextEnergy = Math.floor(20 * (currentLevel + 1) * Math.pow(1.1, currentLevel + 1));
            return { text: `Produkcja: +${(next - current).toLocaleString()}/h`, energyText: `Energia: -${(nextEnergy - currentEnergy).toLocaleString()}`, type: 'gain' };
        }
        if (buildingId === BuildingId.DEUTERIUM_SYNTH) {
            const current = Math.floor(10 * currentLevel * Math.pow(1.1, currentLevel)) * 100;
            const next = Math.floor(10 * (currentLevel + 1) * Math.pow(1.1, currentLevel + 1)) * 100;
            const currentEnergy = Math.floor(40 * currentLevel * Math.pow(1.1, currentLevel));
            const nextEnergy = Math.floor(40 * (currentLevel + 1) * Math.pow(1.1, currentLevel + 1));
            return { text: `Produkcja: +${(next - current).toLocaleString()}/h`, energyText: `Energia: -${(nextEnergy - currentEnergy).toLocaleString()}`, type: 'gain' };
        }
        if (buildingId === BuildingId.SOLAR_PLANT) {
            const current = Math.floor(20 * currentLevel * Math.pow(1.1, currentLevel));
            const next = Math.floor(20 * (currentLevel + 1) * Math.pow(1.1, currentLevel + 1));
            return { text: `Energia: +${(next - current).toLocaleString()}`, type: 'energy' };
        }
        if (buildingId === BuildingId.FUSION_REACTOR) {
            const current = Math.floor(30 * currentLevel * Math.pow(1.05, currentLevel));
            const next = Math.floor(30 * (currentLevel + 1) * Math.pow(1.05, currentLevel + 1));
            return { text: `Energia: +${(next - current).toLocaleString()}`, type: 'energy' };
        }
        // Storage Previews
        if (buildingId === BuildingId.METAL_STORAGE) {
            const current = 10000 + 5000 * Math.floor(Math.pow(2.5, currentLevel));
            const next = 10000 + 5000 * Math.floor(Math.pow(2.5, currentLevel + 1));
            return { text: `Pojemność: ${(current / 1000).toFixed(0)}k -> ${(next / 1000).toFixed(0)}k`, type: 'capacity' };
        }
        if (buildingId === BuildingId.CRYSTAL_STORAGE) {
            const current = 10000 + 5000 * Math.floor(Math.pow(2.5, currentLevel));
            const next = 10000 + 5000 * Math.floor(Math.pow(2.5, currentLevel + 1));
            return { text: `Pojemność: ${(current / 1000).toFixed(0)}k -> ${(next / 1000).toFixed(0)}k`, type: 'capacity' };
        }
        if (buildingId === BuildingId.DEUTERIUM_TANK) {
            const current = 10000 + 5000 * Math.floor(Math.pow(2.5, currentLevel));
            const next = 10000 + 5000 * Math.floor(Math.pow(2.5, currentLevel + 1));
            return { text: `Pojemność: ${(current / 1000).toFixed(0)}k -> ${(next / 1000).toFixed(0)}k`, type: 'capacity' };
        }
        return null;
    }

    const energyBuildings = [BuildingId.METAL_MINE, BuildingId.CRYSTAL_MINE, BuildingId.DEUTERIUM_SYNTH, BuildingId.SOLAR_PLANT, BuildingId.FUSION_REACTOR];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-primary">domain</span>
                    Infrastruktura
                </h2>
                <div className="flex gap-2">
                    <span className="text-sm text-[#929bc9]">Kolejka: {constructionQueue.filter(x => x.type === 'building').length} / 2</span>
                </div>
            </div>

            {/* Energy Management Panel */}
            <div className="bg-[#1c2136] rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-bold text-white uppercase mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-yellow-400">bolt</span>
                    Zarządzanie Energią
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {energyBuildings.map(bid => {
                        const level = buildings[bid];
                        if (level === 0) return null;
                        const setting = productionSettings[bid] ?? 100;
                        return (
                            <div key={bid} className="flex flex-col gap-1 bg-[#111422] p-2 rounded border border-white/5">
                                <div className="flex justify-between text-xs text-[#929bc9]">
                                    <span className="truncate">{BUILDINGS[bid].name}</span>
                                    <span className="font-bold text-white">{setting}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="10"
                                    value={setting}
                                    onChange={(e) => updateProductionSetting(bid, parseInt(e.target.value))}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Storage Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div className="bg-[#1c2136] p-3 rounded-lg border border-white/5 flex items-center justify-between">
                    <span className="text-[#929bc9] text-xs uppercase font-bold">{BUILDINGS[BuildingId.METAL_STORAGE].name}</span>
                    <span className={`text-sm font-mono ${resources.metal >= resources.storage.metal ? 'text-red-400 font-bold' : 'text-white'}`}>
                        {Math.floor(resources.metal).toLocaleString()} / {(resources.storage.metal / 1000).toFixed(0)}k
                    </span>
                </div>
                <div className="bg-[#1c2136] p-3 rounded-lg border border-white/5 flex items-center justify-between">
                    <span className="text-[#929bc9] text-xs uppercase font-bold">{BUILDINGS[BuildingId.CRYSTAL_STORAGE].name}</span>
                    <span className={`text-sm font-mono ${resources.crystal >= resources.storage.crystal ? 'text-red-400 font-bold' : 'text-white'}`}>
                        {Math.floor(resources.crystal).toLocaleString()} / {(resources.storage.crystal / 1000).toFixed(0)}k
                    </span>
                </div>
                <div className="bg-[#1c2136] p-3 rounded-lg border border-white/5 flex items-center justify-between">
                    <span className="text-[#929bc9] text-xs uppercase font-bold">{BUILDINGS[BuildingId.DEUTERIUM_TANK].name}</span>
                    <span className={`text-sm font-mono ${resources.deuterium >= resources.storage.deuterium ? 'text-red-400 font-bold' : 'text-white'}`}>
                        {Math.floor(resources.deuterium).toLocaleString()} / {(resources.storage.deuterium / 1000).toFixed(0)}k
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {buildingList.map((building) => {
                    const level = buildings[building.id];
                    const cost = getCost('building', building.id, level);
                    const canAfford =
                        resources.metal >= cost.metal &&
                        resources.crystal >= cost.crystal &&
                        resources.deuterium >= cost.deuterium;

                    const isThisBuilding = activeBuild?.itemId === building.id;
                    const buildingQueueCount = constructionQueue.filter(x => x.type === 'building').length;
                    const isQueueFull = buildingQueueCount >= 2;
                    const isUnlocked = checkRequirements(building.requirements);

                    const totalRes = cost.metal + cost.crystal;
                    const buildTimeMs = ((totalRes / 2500) * 3600 * 1000) / (robotLevel + 1) / GAME_SPEED;
                    const buildTimeSeconds = Math.max(1, Math.floor(buildTimeMs / 1000));

                    const prodInfo = getProductionInfo(building.id, level);

                    return (
                        <div key={building.id} className={`bg-[#1c2136] rounded-xl border border-white/10 overflow-hidden hover:border-primary/50 transition-all group flex flex-col h-full ${!isUnlocked ? 'opacity-60 grayscale' : ''}`}>
                            <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url("${building.image}")` }}>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1c2136] to-transparent"></div>
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-white border border-white/10 font-mono">
                                    Lvl {level}
                                </div>
                                {isThisBuilding && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm p-4 text-center">
                                        <div className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg mb-2">
                                            W Budowie
                                        </div>
                                        <div className="text-2xl font-mono font-bold text-white">{timeLeft}</div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 flex flex-col flex-1">
                                <h4 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{building.name}</h4>
                                <p className="text-xs text-[#929bc9] mb-4 line-clamp-2 min-h-[32px]">{building.description}</p>

                                {prodInfo && (
                                    <div className="mb-3 flex flex-col gap-0.5">
                                        <div className={`text-xs font-bold ${prodInfo.type === 'energy' ? 'text-yellow-400' : 'text-green-400'}`}>
                                            {prodInfo.text}
                                        </div>
                                        {prodInfo.energyText && (
                                            <div className="text-xs font-bold text-red-400">
                                                {prodInfo.energyText}
                                            </div>
                                        )}
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
                                            onClick={() => upgradeBuilding(building.id)}
                                            disabled={!canAfford || isQueueFull}
                                            className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all shadow-lg
                                                ${!canAfford || isQueueFull
                                                    ? 'bg-[#232948] text-[#929bc9]/50 cursor-not-allowed'
                                                    : 'bg-primary hover:bg-blue-600 text-white hover:shadow-primary/30'
                                                }
                                            `}
                                        >
                                            {isThisBuilding ? 'Czekaj...' : (canAfford ? 'Rozbuduj' : 'Braki')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-auto pt-3 border-t border-red-500/20">
                                        <p className="text-red-400 text-xs font-bold mb-1">Wymagania:</p>
                                        <div className="flex flex-col gap-1">
                                            {building.requirements?.map((req, i) => {
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

export default Buildings;