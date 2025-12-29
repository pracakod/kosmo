
import React, { useState } from 'react';
import { useGame } from '../GameContext';

const Settings: React.FC = () => {
    const { planetName, renamePlanet, resetGame, updateAvatar, avatarUrl } = useGame();
    const [nameInput, setNameInput] = useState(planetName);

    const handleSaveName = () => {
        if (nameInput.trim()) {
            renamePlanet(nameInput.trim());
            alert('Nazwa planety została zmieniona.');
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-[#929bc9]">settings</span>
                    Opcje Gry
                </h2>
            </div>

            {/* General Settings */}
            <div className="bg-[#1c2136] rounded-xl border border-white/10 p-6 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">edit</span>
                    Konfiguracja
                </h3>

                <div className="flex flex-col gap-2 mb-4">
                    <label className="text-sm text-[#929bc9] font-bold uppercase">Nazwa Planety</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            maxLength={20}
                            className="flex-1 bg-[#111422] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                        <button
                            onClick={handleSaveName}
                            className="bg-primary hover:bg-blue-600 text-white px-6 rounded-lg font-bold transition-colors"
                        >
                            Zapisz
                        </button>
                    </div>
                </div>
            </div>

            {/* Avatar Selection */}
            <div className="bg-[#1c2136] rounded-xl border border-white/10 p-6 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-400">face</span>
                    Personalizacja Dowódcy
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { name: "Pomocnik", url: "/kosmo/avatars/avatar_default.png" },
                        { name: "Major (M)", url: "/kosmo/avatars/avatar_major.png" },
                        { name: "Major (K)", url: "/kosmo/avatars/avatar_female.png" },
                        { name: "Cyborg", url: "/kosmo/avatars/avatar_cyber.png" }
                    ].map((av) => (
                        <div key={av.name} className="flex flex-col gap-2">
                            <button
                                onClick={() => updateAvatar(av.url)}
                                className={`relative w-full aspect-square rounded-xl overflow-hidden border-4 transition-all ${avatarUrl === av.url ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-95' : 'border-transparent hover:border-white/20 hover:scale-105'}`}
                            >
                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${av.url}")` }}></div>
                            </button>
                            <span className="text-xs text-center text-[#929bc9] font-medium">{av.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* About */}
            <div className="bg-[#1c2136] rounded-xl border border-white/10 p-6 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400">info</span>
                    O Grze
                </h3>
                <p className="text-[#929bc9] text-sm mb-4 leading-relaxed">
                    Zostań architektem międzygwiezdnego imperium w <strong>Cosmos Conquest</strong>. Obejmij dowodzenie nad nową kolonią, zarządzaj wydobyciem rzadkich surowców i rozwijaj futurystyczne technologie, aby zbudować flotę zdolną do dominacji w galaktyce.
                    Gra łączy głęboką strategię ekonomiczną z dynamiczną symulacją walki w czasie rzeczywistym, oferując immersyjne doświadczenie w nowoczesnym wydaniu.
                </p>
                <div className="text-xs text-[#555a7a] font-mono">
                    Wersja: v1.2.0 (PvP & Commander Update)
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-[#1c2136] rounded-xl border border-red-500/20 p-6 shadow-lg">
                <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">warning</span>
                    Strefa Niebezpieczna
                </h3>
                <p className="text-[#929bc9] text-sm mb-6">
                    Te operacje są nieodwracalne. Zresetowanie gry spowoduje utratę wszystkich postępów, budynków, floty i surowców.
                </p>

                <button
                    onClick={() => { if (confirm('Jesteś pewien? To usunie cały postęp!')) resetGame() }}
                    className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all"
                >
                    Zresetuj Całe Konto
                </button>
            </div>
        </div >
    );
};

export default Settings;
