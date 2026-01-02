
import React from 'react';
import { useGame } from '../GameContext';

const Shop: React.FC = () => {
    const { resources, buyPremium } = useGame();

    const packages = [
        {
            id: 'metal_small',
            name: 'Mała Paczka Metalu',
            description: 'Dostarcza 50,000 Metalu natychmiast.',
            cost: 100,
            reward: { metal: 50000 },
            icon: 'handyman',
            color: 'from-gray-500 to-gray-700'
        },
        {
            id: 'crystal_small',
            name: 'Mała Paczka Kryształu',
            description: 'Dostarcza 25,000 Kryształu natychmiast.',
            cost: 100,
            reward: { crystal: 25000 },
            icon: 'diamond',
            color: 'from-blue-400 to-blue-600'
        },
        {
            id: 'deuterium_small',
            name: 'Mała Paczka Deuteru',
            description: 'Dostarcza 10,000 Deuteru natychmiast.',
            cost: 100,
            reward: { deuterium: 10000 },
            icon: 'propane',
            color: 'from-teal-400 to-teal-600'
        },
        {
            id: 'metal_large',
            name: 'Wielka Skrzynia Metalu',
            description: 'Ogromny zasób 250,000 Metalu.',
            cost: 400,
            reward: { metal: 250000 },
            icon: 'inventory_2',
            color: 'from-yellow-600 to-yellow-800'
        },
        {
            id: 'crystal_large',
            name: 'Wielka Skrzynia Kryształu',
            description: 'Ogromny zasób 125,000 Kryształu.',
            cost: 400,
            reward: { crystal: 125000 },
            icon: 'diamond',
            color: 'from-blue-600 to-blue-800'
        },
        {
            id: 'deuterium_large',
            name: 'Wielka Skrzynia Deuteru',
            description: 'Ogromny zasób 50,000 Deuteru.',
            cost: 400,
            reward: { deuterium: 50000 },
            icon: 'science',
            color: 'from-teal-600 to-teal-800'
        }
    ];

    const handleBuy = (item: typeof packages[0]) => {
        const result = buyPremium(item.cost, item.reward);

        if (result === 'success') {
            alert(`Pomyślnie zakupiono: ${item.name}`);
        } else if (result === 'no_funds') {
            alert('Niewystarczająca ilość Antymaterii!');
        } else if (result === 'storage_full') {
            alert('Magazyny są przepełnione! Powiększ magazyny, aby kupić ten pakiet.');
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-yellow-500">shopping_cart</span>
                    Sklep Premium
                </h2>
                <div className="bg-purple-900/30 border border-purple-500/50 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-purple-900/20">
                    <span className="text-[#929bc9] text-sm font-bold uppercase">Twoja Antymateria:</span>
                    <span className="text-purple-300 font-mono font-bold text-xl">{resources.darkMatter}</span>
                    <span className="material-symbols-outlined text-purple-400 text-sm">all_inclusive</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {packages.map(pkg => (
                    <div key={pkg.id} className="bg-[#1c2136] rounded-xl border border-white/10 overflow-hidden group hover:border-yellow-500/50 transition-all flex flex-col">
                        <div className={`h-16 bg-gradient-to-br ${pkg.color} relative flex items-center justify-center`}>
                            <div className="absolute inset-0 bg-black/20"></div>
                            <span className="material-symbols-outlined text-3xl text-white drop-shadow-lg relative z-10">{pkg.icon}</span>
                            <div className="absolute bottom-1 right-1 bg-black/40 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-mono text-white border border-white/10">
                                -{pkg.cost} DM
                            </div>
                        </div>
                        <div className="p-3 flex flex-col flex-1">
                            <h4 className="text-sm font-bold text-white mb-1 truncate">{pkg.name}</h4>
                            <p className="text-xs text-[#929bc9] mb-2 flex-1 line-clamp-2">{pkg.description}</p>

                            <button
                                onClick={() => handleBuy(pkg)}
                                className="w-full py-2 rounded-lg font-bold uppercase tracking-wider text-xs bg-yellow-600 hover:bg-yellow-500 text-white transition-colors shadow-lg shadow-yellow-900/20 flex items-center justify-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">payments</span>
                                Kup
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-[#111422] rounded-xl p-6 border border-white/5 text-center">
                <h3 className="text-white font-bold mb-2">Potrzebujesz więcej Antymaterii?</h3>
                <p className="text-[#929bc9] text-sm mb-4">Wysyłaj ekspedycje w głęboką przestrzeń, aby znaleźć cenne zasoby Antymaterii!</p>
            </div>
        </div>
    );
};

export default Shop;
