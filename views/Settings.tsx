import React, { useState } from 'react';
import { useGame } from '../GameContext';
import { IMAGES, PLANET_IMAGES } from '../constants';

const Settings: React.FC = () => {
    const {
        planetName, renamePlanet,
        avatarUrl, updateAvatar,
        planetType, updatePlanetType,
        nickname, renameUser,
        resetGame, logout, deleteAccount, abandonColony,
        session, currentPlanetId, planets, mainPlanetName, mainPlanetCoords
    } = useGame();

    const [newNickname, setNewNickname] = useState(nickname || "");
    const [avatarInput, setAvatarInput] = useState(avatarUrl || "");

    const handleRename = (currentName: string, planetId?: string) => {
        const name = prompt("Podaj nową nazwę planety:", currentName);
        if (name && name.trim()) {
            renamePlanet(name.trim(), planetId);
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



            {/* Planet Type Selection */}
            <div className="bg-[#1c2136] rounded-xl border border-white/10 p-6 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400">public</span>
                    Wygląd Planety
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { name: "Ziemiopodobna", type: "terran" },
                        { name: "Pustynna", type: "desert" },
                        { name: "Lodowa", type: "ice" },
                    ].map((p) => (
                        <div key={p.type} className="flex flex-col gap-2">
                            <button
                                onClick={() => updatePlanetType(p.type)}
                                className={`relative w-full aspect-square rounded-xl overflow-hidden border-4 transition-all ${planetType === p.type ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-95' : 'border-transparent hover:border-white/20 hover:scale-105'} `}
                            >
                                <img
                                    src={PLANET_IMAGES[p.type] || IMAGES.planet}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                            <span className="text-xs text-center text-[#929bc9] font-medium">{p.name}</span>
                        </div>
                    ))}
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
                                className={`relative w-full aspect-square rounded-xl overflow-hidden border-4 transition-all ${avatarUrl === av.url ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-95' : 'border-transparent hover:border-white/20 hover:scale-105'} `}
                            >
                                <img
                                    src={av.url}
                                    alt={av.name}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                            <span className="text-xs text-center text-[#929bc9] font-medium">{av.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Empire Management - Planets Table */}
            <div className="bg-[#1c2136] rounded-xl border border-white/10 p-6 shadow-lg overflow-hidden">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-400">language</span>
                    Zarządzanie Imperium
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-[#929bc9] text-xs uppercase tracking-wider">
                                <th className="p-3">Nazwa</th>
                                <th className="p-3">Współrzędne</th>
                                <th className="p-3">Typ</th>
                                <th className="p-3 text-right">Akcje</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {/* Main Planet Row */}
                            <tr className="border-b border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                                <td className="p-3 font-bold text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-yellow-400 text-sm">star</span>
                                    {mainPlanetName || "Główna Planeta"}
                                </td>
                                <td className="p-3 text-[#929bc9] font-mono">
                                    [{mainPlanetCoords?.galaxy || 1}:{mainPlanetCoords?.system || 1}:{mainPlanetCoords?.position || 1}]
                                </td>
                                <td className="p-3 text-[#929bc9]">Główna</td>
                                <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleRename(mainPlanetName || "Główna Planeta", 'main')}
                                            className="text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/30 border border-blue-500/20 px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                            Zmień nazwę
                                        </button>
                                        <span className="text-white/20 italic text-xs px-2">Nieusuwalna</span>
                                    </div>
                                </td>
                            </tr>

                            {/* Colonies Rows */}
                            {planets.map((colony) => (
                                <tr key={colony.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="p-3 text-white font-medium pl-8 relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        {colony.planet_name || "Kolonia"}
                                    </td>
                                    <td className="p-3 text-[#929bc9] font-mono">
                                        [{colony.galaxy}:{colony.system}:{colony.position}]
                                    </td>
                                    <td className="p-3 text-[#929bc9] capitalize">Kolonia</td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleRename(colony.planet_name || "Kolonia", colony.id)}
                                                className="text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/30 border border-blue-500/20 px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                                Zmień nazwę
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!confirm(`⚠️ Czy na pewno chcesz porzucić kolonię: ${colony.planet_name || "Bez nazwy"} [${colony.galaxy}:${colony.system}:${colony.position}]?`)) return;
                                                    if (!confirm("⚠️⚠️ Wszystkie budynki, flota i surowce na tej planecie zostaną UTRACONE. Czy na pewno kontynuować?")) return;
                                                    const confirmation = prompt("⚠️⚠️⚠️ Aby potwierdzić usunięcie kolonii, wpisz słowo: DELETE");
                                                    if (confirmation === 'DELETE') {
                                                        await abandonColony(colony.id, confirmation);
                                                    } else if (confirmation) {
                                                        alert("Błędne hasło potwierdzające. Anulowano.");
                                                    }
                                                }}
                                                className="text-red-400 hover:text-red-200 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                Usuń
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {planets.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-[#555a7a] italic">
                                        Nie posiadasz jeszcze żadnych kolonii.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-[#555a7a] mt-4 text-center">
                    Główna planeta nie może zostać usunięta. Kolonie można porzucić, co jest procesem nieodwracalnym.
                </p>
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
                        onClick={() => { if (confirm('Czy na pewno chcesz się wylogować?')) logout() }}
                        className="bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-white border border-yellow-500/20 px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all"
                    >
                        Wyloguj się
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
