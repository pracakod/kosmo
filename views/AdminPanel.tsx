import React, { useState, useEffect } from 'react';
import { useGame } from '../GameContext';
import { supabase } from '../lib/supabase';

export const AdminPanel: React.FC = () => {
    const { session } = useGame();
    const [users, setUsers] = useState<any[]>([]);
    const [errorLogs, setErrorLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [showErrors, setShowErrors] = useState(false);
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

    const toggleExpand = (userId: string) => {
        const newSet = new Set(expandedUsers);
        if (newSet.has(userId)) newSet.delete(userId);
        else newSet.add(userId);
        setExpandedUsers(newSet);
    };

    const fetchUsers = async () => {
        setLoading(true);
        // Fetch Profiles
        const { data: profiles, error: pError } = await supabase
            .from('profiles')
            .select('*')
            .order('last_updated', { ascending: false });

        // Fetch Planets
        const { data: planets, error: plError } = await supabase
            .from('planets')
            .select('*');

        if (pError) {
            console.error("Admin fetch error", pError);
            setMsg(`Błąd pobierania: ${pError.message}`);
        } else {
            const allPlanets = planets || [];
            const joined = profiles?.map((p: any) => ({
                ...p,
                colonies: allPlanets.filter((pl: any) => pl.owner_id === p.id)
            })) || [];
            setUsers(joined);
        }
        setLoading(false);
    };

    const fetchErrorLogs = async () => {
        const { data, error } = await supabase
            .from('error_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        if (!error) {
            setErrorLogs(data || []);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchErrorLogs();
    }, []);

    const deleteUser = async (userId: string, nickname: string) => {
        if (!confirm(`CZY NA PEWNO CHCESZ USUNĄĆ GRACZA ${nickname || userId}?\nTej operacji nie można cofnąć!`)) return;

        setLoading(true);

        // DEBUG: Check if we can even SEE the missions
        const { count: missionCount, error: countError } = await supabase
            .from('missions')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', userId);

        console.log(`[DEBUG] Found ${missionCount} missions (Error: ${countError?.message})`);

        // Step 1: Delete Missions
        const d1 = await supabase.from('missions').delete().eq('owner_id', userId).select();
        const d2 = await supabase.from('missions').delete().eq('target_user_id', userId).select();

        console.log(`[DEBUG] Deleted ${d1.count} outgoing, ${d2.count} incoming.`);

        // Step 2: Delete Profile (Planet)
        const response = await supabase.from('profiles').delete().eq('id', userId).select();
        const error = response.error;
        const count = response.count;

        if (error) {
            console.error("Profile Delete error:", error);
            if (error.message?.includes("foreign key constraint") || error.code === '23503') {
                const fixSQL = `
ALTER TABLE missions
DROP CONSTRAINT missions_owner_id_fkey,
ADD CONSTRAINT missions_owner_id_fkey
FOREIGN KEY (owner_id)
REFERENCES profiles(id)
ON DELETE CASCADE;
`;
                alert(`BLOKADA BAZY DANYCH (Foreign Key):\nNie można usunąć gracza, bo trzymają go misje (których admin nie widzi przez RLS).\n\nNAJLEPSZE ROZWIĄZANIE:\nWklej ten SQL w Supabase, aby misje usuwały się SAME automatycznie:\n\n${fixSQL}`);
                console.log("SQL TO FIX:", fixSQL);
            } else {
                alert(`Błąd usuwania (DB Error): ${error.message} (Code: ${error.code})`);
            }
        } else if (count === 0) {
            alert(`BŁĄD: Nie usunięto wiersza (Count: 0).\nZablokowane przez RLS tabeli 'profiles'.\nPotrzebna polityka: CREATE POLICY "Admin All Access" ...`);
        } else {
            setMsg(`Użytkownik ${nickname || 'Nieznany'} (ID: ${userId}) został pomyślnie usunięty.`);
            fetchUsers();
        }
        setLoading(false);
    };

    // HARDCODED ADMIN CHECK (Replace with your email)
    const ADMIN_EMAILS = ['admin@kosmo.pl', 'dareg@kosmo.pl', 'admin@kosmo.com']; // Add your email here
    const userEmail = session?.user?.email;

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        return (
            <div className="p-8 text-center text-red-500">
                <h2 className="text-2xl font-bold">⛔ Brak Uprawnień</h2>
                <p>Tylko administratorzy mają dostęp do tego panelu.</p>
            </div>
        );
    }

    const [inspectUser, setInspectUser] = useState<any | null>(null);

    // Ship Gift Feature
    // Ship Gift Feature
    const [giftUserId, setGiftUserId] = useState('');
    const [giftShipId, setGiftShipId] = useState('colonyShip');
    const [giftAmount, setGiftAmount] = useState(1);

    const giveShip = async () => {
        if (!giftUserId) {
            alert('Wybierz gracza z listy!');
            return;
        }

        const targetUser = users.find(u => u.id === giftUserId);
        if (!targetUser) return;

        console.log('🎁 Nadawanie statku dla:', targetUser.nickname || targetUser.id);

        // Update ships on MAIN PLANET (UserProfile)
        const currentShips = targetUser.ships || {};
        const newShips = { ...currentShips, [giftShipId]: (currentShips[giftShipId] || 0) + giftAmount };

        console.log('🎁 Aktualizacja:', { currentShips, newShips, targetId: targetUser.id });

        const { data: updateResult, error: updateError } = await supabase
            .from('profiles')
            .update({ ships: newShips })
            .eq('id', targetUser.id)
            .select();

        console.log('🎁 Wynik aktualizacji:', { updateResult, updateError });

        if (updateError) {
            alert(`Błąd aktualizacji: ${updateError.message}\n\nMoże brakować RLS policy pozwalającej adminowi edytować inne profile.`);
        } else if (!updateResult || updateResult.length === 0) {
            alert(`⚠️ Update nie zmienił żadnych rekordów!\n\nPrawdopodobnie RLS blokuje edycję innych graczy.\n\nDodaj w Supabase SQL:\nCREATE POLICY "admin_all_access" ON profiles FOR ALL USING (auth.jwt() ->> 'email' IN ('admin@kosmo.pl', 'dareg@kosmo.pl'));`);
        } else {
            alert(`✅ Dodano ${giftAmount}x ${giftShipId} graczowi ${targetUser.nickname || 'ID:' + targetUser.id}`);
            setGiftAmount(1);
            await fetchUsers();
        }
    };



    return (
        <div className="p-4 md:p-8 text-gray-100 max-w-6xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-red-500 flex items-center gap-2">
                    🛡️ PANEL ADMINISTRATORA
                </h1>
                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
                >
                    {loading ? "Odświeżanie..." : "Odśwież"}
                </button>
            </div>

            {msg && <div className="mb-4 p-3 bg-green-900 border border-green-700 rounded text-green-200">{msg}</div>}

            {/* Ship Gift Section */}
            <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                <h3 className="text-lg font-bold text-yellow-500 mb-4">🎁 Dodaj Statek Graczowi</h3>
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col flex-1 min-w-[200px]">
                        <label className="text-xs text-gray-400 mb-1">Gracz</label>
                        <select
                            value={giftUserId}
                            onChange={(e) => setGiftUserId(e.target.value)}
                            className="px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:border-yellow-500 focus:outline-none w-full"
                        >
                            <option value="">-- Wybierz Gracza --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.nickname} {u.galaxy_coords ? `[${u.galaxy_coords.galaxy}:${u.galaxy_coords.system}:${u.galaxy_coords.position}]` : '[-]'} (ID: {u.id.slice(0, 4)}...)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-400 mb-1">Typ Statku</label>
                        <select
                            value={giftShipId}
                            onChange={(e) => setGiftShipId(e.target.value)}
                            className="px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:border-yellow-500 focus:outline-none"
                        >
                            <option value="colonyShip">Statek Kolonizacyjny</option>
                            <option value="lightFighter">Myśliwiec Lekki</option>
                            <option value="heavyFighter">Myśliwiec Ciężki</option>
                            <option value="cruiser">Krążownik</option>
                            <option value="battleship">Okręt Wojenny</option>
                            <option value="destroyer">Niszczyciel</option>
                            <option value="deathStar">Pogromca Planet</option>
                            <option value="smallCargo">Mały Transporter</option>
                            <option value="mediumCargo">Średni Transporter</option>
                            <option value="hugeCargo">Ogromny Transporter</option>
                            <option value="espionageProbe">Sonda Szpiegowska</option>
                            <option value="pioneer">Pionier</option>
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-400 mb-1">Ilość</label>
                        <input
                            type="number"
                            value={giftAmount}
                            onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 1))}
                            min={1}
                            className="w-20 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:border-yellow-500 focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={giveShip}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded transition-colors"
                    >
                        Dodaj
                    </button>
                </div>
            </div>

            {/* Error Logs Section */}
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setShowErrors(!showErrors)}
                >
                    <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                        🐛 Błędy Użytkowników
                        <span className="text-xs bg-red-600 px-2 py-0.5 rounded">{errorLogs.length}</span>
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); fetchErrorLogs(); }}
                            className="text-xs bg-red-600/30 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                        >Odśwież</button>
                        <span className="text-red-400">{showErrors ? '▼' : '▶'}</span>
                    </div>
                </div>

                {showErrors && (
                    <div className="mt-4 max-h-[400px] overflow-y-auto">
                        {errorLogs.length === 0 ? (
                            <p className="text-gray-500 text-sm">Brak zgłoszonych błędów. Upewnij się, że tabela error_logs istnieje w Supabase.</p>
                        ) : (
                            <div className="space-y-2">
                                {errorLogs.map((err, i) => (
                                    <div key={i} className="bg-black/30 p-3 rounded border border-red-500/20 text-xs">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-bold ${err.error_type === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
                                                {err.error_type === 'error' ? '🔴 ERROR' : '🟡 WARNING'}
                                            </span>
                                            <span className="text-gray-500">{new Date(err.created_at).toLocaleString('pl-PL')}</span>
                                        </div>
                                        <p className="text-white mb-1">{err.message}</p>
                                        {err.context && <p className="text-gray-400 text-[10px]">📍 {err.context}</p>}
                                        {err.user_id && (
                                            <p className="text-gray-600 text-[10px] font-mono mt-1">
                                                User: {err.user_id.slice(0, 8)}... | {err.user_agent?.slice(0, 50)}...
                                            </p>
                                        )}
                                        {err.stack && (
                                            <details className="mt-2">
                                                <summary className="text-gray-500 cursor-pointer hover:text-gray-300">Stack trace</summary>
                                                <pre className="text-[9px] text-gray-600 mt-1 whitespace-pre-wrap">{err.stack}</pre>
                                            </details>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="overflow-x-auto bg-gray-900/80 rounded-lg border border-gray-700">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-800 text-gray-400 uppercase text-xs">
                            <th className="p-4 border-b border-gray-700">Nick</th>
                            <th className="p-4 border-b border-gray-700">Punkty</th>
                            <th className="p-4 border-b border-gray-700">Koordynaty</th>
                            <th className="p-4 border-b border-gray-700">Ostatnia Akt.</th>
                            <th className="p-4 border-b border-gray-700 text-right">Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <React.Fragment key={u.id}>
                                <tr className={`hover:bg-gray-800/50 transition-colors border-b border-gray-800 ${expandedUsers.has(u.id) ? 'bg-gray-800/30' : ''}`}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => toggleExpand(u.id)}
                                                className={`text-gray-400 hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded border border-gray-700 ${expandedUsers.has(u.id) ? 'bg-blue-600 border-blue-500 text-white' : ''}`}
                                            >
                                                {expandedUsers.has(u.id) ? '▼' : '▶'}
                                            </button>
                                            <div>
                                                <div className="font-bold text-blue-300">{u.nickname || 'Nieznany'}</div>
                                                <div className="text-xs text-gray-500">{u.planet_name}</div>
                                                <div className="text-[10px] text-gray-600 font-mono">{u.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-yellow-400">
                                        {(u.points || 0).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-mono text-gray-300">
                                        {u.galaxy_coords ? `[${u.galaxy_coords.galaxy}:${u.galaxy_coords.system}:${u.galaxy_coords.position}]` : 'BRAK'}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {u.last_updated ? new Date(u.last_updated).toLocaleString() : '-'}
                                        <div className="text-xs text-gray-600 mt-1">Kolonie: {u.colonies?.length || 0}</div>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => setInspectUser(u)}
                                            className="bg-blue-600/20 hover:bg-blue-600 text-blue-500 hover:text-white px-3 py-1 rounded transition-colors font-bold text-xs"
                                        >
                                            INFO
                                        </button>
                                        <button
                                            onClick={() => deleteUser(u.id, u.nickname)}
                                            className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-3 py-1 rounded transition-colors font-bold text-xs"
                                            title="Usuń Gracza i Planetę"
                                        >
                                            USUŃ
                                        </button>
                                    </td>
                                </tr>
                                {expandedUsers.has(u.id) && (
                                    <tr className="bg-black/20 animate-in fade-in zoom-in-95 duration-200">
                                        <td colSpan={5} className="p-0">
                                            <div className="p-4 pl-14 bg-black/40 border-b border-gray-800 shadow-inner">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-sm">public</span>
                                                    Kolonie gracza ({u.colonies?.length || 0})
                                                </h4>
                                                {(!u.colonies || u.colonies.length === 0) ? (
                                                    <div className="text-gray-600 text-sm italic">Brak kolonii</div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {u.colonies.map((col: any) => (
                                                            <div key={col.id} className="bg-[#111422] p-3 rounded border border-white/5 hover:border-blue-500/30 transition-colors">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="font-bold text-white text-sm">{col.planet_name || "Bez nazwy"}</span>
                                                                    <span className="font-mono text-xs text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded">
                                                                        [{col.galaxy}:{col.system}:{col.position}]
                                                                    </span>
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 font-mono mb-2">{col.id}</div>
                                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                                    <div><span className="text-yellow-600">M:</span> {Math.floor(col.resources?.metal || 0)}</div>
                                                                    <div><span className="text-blue-600">K:</span> {Math.floor(col.resources?.crystal || 0)}</div>
                                                                    <div><span className="text-green-600">D:</span> {Math.floor(col.resources?.deuterium || 0)}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        {users.length === 0 && !loading && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Brak użytkowników</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* INSPECT MODAL */}
            {inspectUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1c2136] border border-blue-500/30 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#111422]">
                            <h2 className="text-xl font-bold text-blue-400">Szczegóły: {inspectUser.nickname}</h2>
                            <button onClick={() => setInspectUser(null)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                        </div>
                        <div className="p-6 space-y-6">

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-[#111422] p-3 rounded border border-white/5">
                                    <div className="text-xs text-gray-500 uppercase">Metal</div>
                                    <div className="text-yellow-400 font-mono">{Math.floor(inspectUser.resources?.metal || 0).toLocaleString()}</div>
                                </div>
                                <div className="bg-[#111422] p-3 rounded border border-white/5">
                                    <div className="text-xs text-gray-500 uppercase">Kryształ</div>
                                    <div className="text-blue-400 font-mono">{Math.floor(inspectUser.resources?.crystal || 0).toLocaleString()}</div>
                                </div>
                                <div className="bg-[#111422] p-3 rounded border border-white/5">
                                    <div className="text-xs text-gray-500 uppercase">Deuter</div>
                                    <div className="text-green-400 font-mono">{Math.floor(inspectUser.resources?.deuterium || 0).toLocaleString()}</div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase border-b border-white/10 pb-1">Budynki</h3>
                                <pre className="text-xs font-mono bg-black/30 p-2 rounded text-gray-300 overflow-x-auto">
                                    {JSON.stringify(inspectUser.buildings, null, 2)}
                                </pre>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase border-b border-white/10 pb-1">Flota</h3>
                                <pre className="text-xs font-mono bg-black/30 p-2 rounded text-gray-300 overflow-x-auto">
                                    {JSON.stringify(inspectUser.ships, null, 2)}
                                </pre>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase border-b border-white/10 pb-1">Obrona</h3>
                                <pre className="text-xs font-mono bg-black/30 p-2 rounded text-gray-300 overflow-x-auto">
                                    {JSON.stringify(inspectUser.defenses, null, 2)}
                                </pre>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase border-b border-white/10 pb-1">Badania</h3>
                                <pre className="text-xs font-mono bg-black/30 p-2 rounded text-gray-300 overflow-x-auto">
                                    {JSON.stringify(inspectUser.research, null, 2)}
                                </pre>
                            </div>

                            <div className="text-xs text-gray-600 font-mono pt-4 border-t border-white/5">
                                Raw Data Preview (Debug)
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/10 bg-[#111422] text-right">
                            <button onClick={() => setInspectUser(null)} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors">Zamknij</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
