
import React from 'react';
import { useGame } from '../GameContext';

// Defense structures definitions
const DEFENSES = [
    { id: 'rocketLauncher', name: 'Wyrzutnia Rakiet', desc: 'Podstawowa obrona planetarna. Skuteczna przeciwko małym celom.', attack: 80, defense: 20, cost: { metal: 2000, crystal: 0, deuterium: 0 }, icon: 'rocket' },
    { id: 'lightLaser', name: 'Lekkie Działko Laserowe', desc: 'Szybkostrzelna wieżyczka laserowa. Idealna do zwalczania myśliwców.', attack: 100, defense: 25, cost: { metal: 1500, crystal: 500, deuterium: 0 }, icon: 'electric_bolt' },
    { id: 'heavyLaser', name: 'Ciężkie Działko Laserowe', desc: 'Potężny laser zdolny przebić pancerz średnich okrętów.', attack: 250, defense: 100, cost: { metal: 6000, crystal: 2000, deuterium: 0 }, icon: 'bolt' },
    { id: 'gaussCannon', name: 'Działo Gaussa', desc: 'Elektromagnetyczne działo wystrzeliwujące pociski z ogromną prędkością.', attack: 1100, defense: 200, cost: { metal: 20000, crystal: 15000, deuterium: 2000 }, icon: 'gps_fixed' },
    { id: 'ionCannon', name: 'Działo Jonowe', desc: 'Zaawansowana technologia jonowa dezaktywująca systemy wroga.', attack: 150, defense: 500, cost: { metal: 5000, crystal: 3000, deuterium: 1000 }, icon: 'flashlight' },
    { id: 'plasmaTurret', name: 'Wieżyczka Plazmowa', desc: 'Najpotężniejsza broń obronna. Zdolna zniszczyć niszczyciele jednym strzałem.', attack: 3000, defense: 300, cost: { metal: 50000, crystal: 50000, deuterium: 30000 }, icon: 'local_fire_department' },
    { id: 'smallShield', name: 'Mała Osłona Tarczowa', desc: 'Kopuła energetyczna chroniąca część planety przed atakami.', attack: 1, defense: 2000, cost: { metal: 10000, crystal: 10000, deuterium: 0 }, icon: 'shield' },
    { id: 'largeShield', name: 'Duża Osłona Tarczowa', desc: 'Masywna tarcza energetyczna obejmująca całą planetę.', attack: 1, defense: 10000, cost: { metal: 50000, crystal: 50000, deuterium: 0 }, icon: 'security' },
];

const Defense: React.FC = () => {
    const { resources, buildings } = useGame();
    const shipyardLevel = buildings?.shipyard || 0;

    return (
        <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold mb-6 text-white tracking-widest uppercase border-b border-white/10 pb-4">
                <span className="text-primary">System</span> Obrony Planetarnej
            </h2>

            {shipyardLevel < 1 ? (
                <div className="bg-[#1c2136] rounded-xl border border-yellow-500/30 p-8 text-center">
                    <span className="material-symbols-outlined text-yellow-500 text-5xl mb-4">construction</span>
                    <h3 className="text-xl font-bold text-white mb-2">Wymagana Stocznia</h3>
                    <p className="text-[#929bc9]">Zbuduj Stocznię (poziom 1), aby odblokować systemy obronne.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {DEFENSES.map((def) => {
                        const canAfford = resources.metal >= def.cost.metal && resources.crystal >= def.cost.crystal && resources.deuterium >= def.cost.deuterium;

                        return (
                            <div key={def.id} className="bg-[#1c2136] rounded-xl border border-white/5 p-4 hover:border-primary/30 transition-all group">
                                <div className="flex items-start gap-4">
                                    <div className="size-14 rounded-xl bg-[#111422] flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                                        <span className="material-symbols-outlined text-primary text-2xl">{def.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold mb-1">{def.name}</h3>
                                        <p className="text-[#929bc9] text-xs mb-3 line-clamp-2">{def.desc}</p>

                                        <div className="flex gap-3 text-xs mb-3">
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-red-500 text-sm">swords</span>
                                                <span className="text-white font-mono">{def.attack}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-blue-500 text-sm">shield</span>
                                                <span className="text-white font-mono">{def.defense}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 text-[10px] mb-3">
                                            <span className={`px-2 py-1 rounded ${resources.metal >= def.cost.metal ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                M: {def.cost.metal.toLocaleString()}
                                            </span>
                                            <span className={`px-2 py-1 rounded ${resources.crystal >= def.cost.crystal ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                C: {def.cost.crystal.toLocaleString()}
                                            </span>
                                            {def.cost.deuterium > 0 && (
                                                <span className={`px-2 py-1 rounded ${resources.deuterium >= def.cost.deuterium ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    D: {def.cost.deuterium.toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            disabled={!canAfford}
                                            className={`w-full py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${canAfford ? 'bg-primary hover:bg-blue-600 text-white' : 'bg-[#111422] text-[#555a7a] cursor-not-allowed'}`}
                                        >
                                            {canAfford ? 'Buduj' : 'Brak zasobów'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-8 bg-[#1c2136]/50 rounded-xl border border-white/5 p-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-500">info</span>
                    Informacje o Obronie
                </h3>
                <ul className="text-[#929bc9] text-sm space-y-2">
                    <li>• Jednostki obronne są stacjonarne i bronią Twojej planety przed atakami.</li>
                    <li>• Po zniszczeniu, jednostki mają 70% szans na naprawę po bitwie.</li>
                    <li>• Tarcze absorbują obrażenia przed trafieniem innych jednostek.</li>
                    <li>• Nie możesz wysyłać jednostek obronnych na misje.</li>
                </ul>
            </div>
        </div>
    );
};

export default Defense;
