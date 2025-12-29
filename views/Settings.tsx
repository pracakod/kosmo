import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext';
import { IMAGES } from '../constants';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const {
        planetName, renamePlanet,
        avatarUrl, updateAvatar,
        nickname, renameUser,
        resetGame, logout, deleteAccount
    } = useGame();

    const [newName, setNewName] = useState(planetName);
    const [newNickname, setNewNickname] = useState(nickname || "");
    const [avatarInput, setAvatarInput] = useState(avatarUrl || "");

    const handleSaveName = () => {
        if (newName.trim()) {
            renamePlanet(newName.trim());
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

            {/* Player Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/5">
                {/* Nickname */}
                <div className="bg-[#1c2136] p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">badge</span>
                        Nazwa Dowódcy
                    </h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-[#111422] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                            placeholder="Wpisz nową nazwę"
                            value={newNickname}
                            onChange={(e) => setNewNickname(e.target.value)}
                        />
                        <button
                            onClick={() => renameUser(newNickname)}
                            className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                        >
                            Zmień
                        </button>
                    </div>
                </div>

                {/* Avatar */}
                <div className="bg-[#1c2136] p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">face</span>
                        Awatar
                    </h3>
                    <div className="flex flex-col gap-2 mb-4">
                        <label className="text-sm text-[#929bc9] font-bold uppercase">URL Awatara</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={avatarInput}
                                onChange={(e) => setAvatarInput(e.target.value)}
                                className="flex-1 bg-[#111422] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="Wklej URL obrazka"
                            />
                            <button
                                onClick={() => updateAvatar(avatarInput)}
                                className="bg-primary hover:bg-blue-600 text-white px-6 rounded-lg font-bold transition-colors"
                            >
                                Zapisz
                            </button>
                        </div>
                    </div>
                </div>
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
                    Wersja: v1.2.5 (Ranking & Security)
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

                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => { if (confirm('To usunie tylko dane z tego urządzenia (wyloguje). Aby usunąć konto z serwera, użyj drugiego przycisku.')) resetGame() }}
                        className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all"
                    >
                        Wyloguj i Wyczyść Konsolę
                    </button>

                    <button
                        onClick={deleteAccount}
                        className="bg-red-900/50 hover:bg-red-700 text-white border border-red-500/50 px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">delete_forever</span>
                        Usuń Konto Trwale
                    </button>
                    <p className="text-xs text-red-400 text-center mt-2">
                        Uwaga: Usunięcie konta trwale wykasuje Twój profil i misje z bazy danych. Tej akcji nie da się cofnąć!
                    </p>
                </div>
            </div>
        </div >
    );
};

export default Settings;
