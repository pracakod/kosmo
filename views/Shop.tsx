
import React from 'react';
import { useGame } from '../GameContext';

const Shop: React.FC = () => {
    const { resources, buyPremium } = useGame();
    const [activeCategory, setActiveCategory] = React.useState<'resources' | 'bonuses' | 'ships'>('resources');

    const resourcePackages = [
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

    const bonusPackages = [
        {
            id: 'build_speed_1h',
            name: 'Przyspieszenie Budowy (1h)',
            description: 'Skraca czas budowy wszystkich budynków o 1 godzinę.',
            cost: 500,
            reward: { custom: 'build_speed_1h' },
            icon: 'speed',
            color: 'from-green-500 to-green-700'
        },
        {
            id: 'research_speed_1h',
            name: 'Przyspieszenie Badań (1h)',
            description: 'Skraca czas trwania badań o 1 godzinę.',
            cost: 500,
            reward: { custom: 'research_speed_1h' },
            icon: 'science',
            color: 'from-purple-500 to-purple-700'
        },
        {
            id: 'fleet_speed_24h',
            name: 'Dopalacz Napędu (24h)',
            description: 'Zwiększa prędkość wszystkich flot o 20% na 24 godziny.',
            cost: 1000,
            reward: { custom: 'fleet_speed_24h' },
            icon: 'rocket_launch',
            color: 'from-orange-500 to-orange-700'
        }
    ];

    const shipPackages = [
        {
            id: 'death_star',
            name: 'Gwiazda Śmierci',
            description: 'Ostateczna broń imperium. Posiada superlaser zdolny do natychmiastowego zniszczenia wybranej planety wroga.',
            cost: 10000000,
            reward: { custom: 'death_star' },
            icon: 'public_off', // planetary destruction icon
            color: 'from-red-900 to-black',
            special: true,
            unavailable: true
        }
    ];

    const handleBuy = async (item: any) => {
        if (item.unavailable) {
            return;
        }
        if (item.reward.custom) {
            alert('Ten przedmiot jest obecnie niedostępny w sklepie (Wkrótce!).');
            return;
        }

        const result = await buyPremium(item.cost, item.reward);

        if (result === 'success') {
            alert(`Pomyślnie zakupiono: ${item.name}`);
        } else if (result === 'no_funds') {
            alert('Niewystarczająca ilość Antymaterii!');
        } else if (result === 'storage_full') {
            alert('Magazyny są przepełnione! Powiększ magazyny, aby kupić ten pakiet.');
        }
    };

    const getItems = () => {
        switch (activeCategory) {
            case 'resources': return resourcePackages;
            case 'bonuses': return bonusPackages;
            case 'ships': return shipPackages;
            default: return [];
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-white/10 pb-4">
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

            {/* Categories Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-1">
                <button
                    onClick={() => setActiveCategory('resources')}
                    className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors flex items-center gap-2 ${activeCategory === 'resources' ? 'bg-yellow-600/20 text-yellow-500 border-b-2 border-yellow-500' : 'text-[#929bc9] hover:text-white hover:bg-white/5'}`}
                >
                    <span className="material-symbols-outlined text-lg">inventory_2</span>
                    Surowce
                </button>
                <button
                    onClick={() => setActiveCategory('bonuses')}
                    className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors flex items-center gap-2 ${activeCategory === 'bonuses' ? 'bg-blue-600/20 text-blue-500 border-b-2 border-blue-500' : 'text-[#929bc9] hover:text-white hover:bg-white/5'}`}
                >
                    <span className="material-symbols-outlined text-lg">stars</span>
                    Bonusy
                </button>
                <button
                    onClick={() => setActiveCategory('ships')}
                    className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors flex items-center gap-2 ${activeCategory === 'ships' ? 'bg-red-600/20 text-red-500 border-b-2 border-red-500' : 'text-[#929bc9] hover:text-white hover:bg-white/5'}`}
                >
                    <span className="material-symbols-outlined text-lg">rocket</span>
                    Statki
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {getItems().map(item => (
                    <div key={item.id} className={`bg-[#1c2136] rounded-xl border overflow-hidden group transition-all flex flex-col ${item.special ? 'border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'border-white/10 hover:border-yellow-500/50'}`}>
                        <div className={`h-24 bg-gradient-to-br ${item.color} relative flex items-center justify-center overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/30"></div>

                            {/* Special Effect for Death Star */}
                            {item.special && (
                                <div className="absolute inset-0 opacity-50 animate-pulse"
                                    style={{ background: 'radial-gradient(circle at center, rgba(255,0,0,0.5) 0%, transparent 70%)' }}>
                                </div>
                            )}

                            <span className={`material-symbols-outlined text-5xl text-white drop-shadow-lg relative z-10 ${item.special ? 'animate-[pulse_4s_ease-in-out_infinite]' : ''}`}>{item.icon}</span>

                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-mono text-white border border-white/10">
                                {item.cost.toLocaleString()} DM
                            </div>
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                            <h4 className={`text-base font-bold mb-2 truncate ${item.special ? 'text-red-400' : 'text-white'}`}>{item.name}</h4>
                            <p className="text-xs text-[#929bc9] mb-4 flex-1">{item.description}</p>

                            <button
                                onClick={() => handleBuy(item)}
                                disabled={item.unavailable as boolean}
                                className={`w-full py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors shadow-lg flex items-center justify-center gap-1 ${item.unavailable
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed border border-white/5'
                                    : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-900/20'
                                    }`}
                            >
                                {item.unavailable ? (
                                    <>
                                        <span className="material-symbols-outlined text-sm">lock</span>
                                        Niedostępne
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">payments</span>
                                        Kup
                                    </>
                                )}
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
