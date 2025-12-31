
import React from 'react';
import { useGame } from '../GameContext';

const ResourceItem: React.FC<{
    name: string;
    value: number;
    icon: string;
    production?: number;
    subValue?: number;
    colorClass: string;
    bgClass: string;
    description?: string;
}> = ({ name, value, icon, production, subValue, colorClass, bgClass }) => (
    <div
        className={`flex items-center gap-2 md:gap-3 min-w-[90px] md:min-w-[150px] px-2 py-1 md:px-3 md:py-2 rounded-xl border border-white/5 ${bgClass} backdrop-blur-md flex-shrink-0 shadow-sm transition-colors`}
    >
        <div className={`size-6 md:size-10 rounded-full flex items-center justify-center shadow-lg ${colorClass}`}>
            <span className="material-symbols-outlined text-white text-xs md:text-lg">{icon}</span>
        </div>
        <div className="flex flex-col justify-center">
            <span className="text-[9px] md:text-[10px] text-[#929bc9] font-bold uppercase tracking-wider mb-0.5">{name}</span>
            <div className="flex flex-col md:flex-row md:items-baseline md:gap-2">
                <span className={`text-xs md:text-lg font-bold font-mono leading-none ${(value ?? 0) < 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {Math.floor(value ?? 0).toLocaleString()}
                </span>

                {/* Production display optimized for mobile */}
                {production !== undefined && (
                    <div className="flex items-center gap-0.5 mt-0.5 md:mt-0">
                        <span className="material-symbols-outlined text-[10px] text-[#0bda65]">trending_up</span>
                        <span className="text-[#0bda65] text-[10px] font-medium font-mono leading-none whitespace-nowrap">
                            {Math.floor((production ?? 0) * 3600).toLocaleString()}/h
                        </span>
                    </div>
                )}

                {subValue !== undefined && (
                    <span className="text-[#929bc9] text-[10px] font-medium leading-none whitespace-nowrap mt-0.5 md:mt-0">
                        / {(subValue ?? 0).toLocaleString()}
                    </span>
                )}
            </div>
        </div>
    </div>
);

const ResourceHeader: React.FC = () => {
    const { resources, productionRates, logout } = useGame();

    return (
        <header className="bg-[#111422]/90 backdrop-blur-md border-b border-white/5 p-3 flex-shrink-0 z-20">
            <div className="flex flex-wrap gap-3 justify-between items-center w-full">
                <div className="flex gap-2 md:gap-3 flex-1 overflow-x-auto pb-2 items-center">
                    <ResourceItem
                        name="Metal"
                        value={resources.metal}
                        production={productionRates?.metal}
                        icon="handyman"
                        colorClass="bg-gradient-to-br from-gray-500 to-gray-700"
                        bgClass="bg-[#1c2136]"
                    />
                    <ResourceItem
                        name="Kryształ"
                        value={resources.crystal}
                        production={productionRates?.crystal}
                        icon="diamond"
                        colorClass="bg-gradient-to-br from-blue-400 to-blue-600"
                        bgClass="bg-[#1c2136]"
                    />
                    <ResourceItem
                        name="Deuter"
                        value={resources.deuterium}
                        production={productionRates?.deuterium}
                        icon="propane"
                        colorClass="bg-gradient-to-br from-teal-400 to-teal-600"
                        bgClass="bg-[#1c2136]"
                    />
                    <ResourceItem
                        name="Energia"
                        value={resources.energy}
                        subValue={resources.maxEnergy}
                        icon="bolt"
                        colorClass="bg-gradient-to-br from-yellow-400 to-orange-500"
                        bgClass="bg-[#1c2136]"
                    />
                    <ResourceItem
                        name="Antymateria"
                        value={resources.darkMatter || 0}
                        icon="all_inclusive"
                        colorClass="bg-gradient-to-br from-purple-500 to-indigo-600"
                        bgClass="bg-[#1c2136] border-purple-500/20 shadow-purple-900/20"
                    />
                </div>
                <div className="hidden lg:block">
                    <button
                        onClick={logout}
                        className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-primary cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-primary/20 flex items-center justify-center group bg-[#111422]"
                        title="Wyloguj"
                    >
                        <span className="material-symbols-outlined text-white group-hover:text-red-400 transition-colors">logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default ResourceHeader;
