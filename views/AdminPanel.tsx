import React, { useState, useEffect } from 'react';
import { useGame } from '../GameContext';
import { supabase } from '../lib/supabase';

export const AdminPanel: React.FC = () => {
    const { session } = useGame();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('id, nickname, planet_name, galaxy_coords, last_updated, resources');
        if (error) {
            console.error("Admin fetch error", error);
            setMsg(`Błąd pobierania: ${error.message}`);
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const deleteUser = async (userId: string, nickname: string) => {
        if (!confirm(`CZY NA PEWNO CHCESZ USUNĄĆ GRACZA ${nickname || userId}?\nTej operacji nie można cofnąć!`)) return;

        setLoading(true);

        // Step 1: Delete Missions (Try to remove both outgoing and incoming)
        const d1 = await supabase.from('missions').delete().eq('owner_id', userId).select('*', { count: 'exact', head: true });
        const d2 = await supabase.from('missions').delete().eq('target_user_id', userId).select('*', { count: 'exact', head: true });

        if (d1.error || d2.error) {
            console.error("Mission delete error:", d1.error, d2.error);
            alert("Błąd usuwania misji (RLS?). Sprawdź konsolę. Kontynuuję usuwanie profilu...");
        } else {
            console.log(`Usunięto ${d1.count} misji własnych i ${d2.count} przychodzących.`);
        }

        // Step 2: Delete Profile (Planet)
        const response = await supabase.from('profiles').delete().eq('id', userId).select('*', { count: 'exact', head: true });
        const error = response.error;
        const count = response.count;

        if (error) {
            console.error("Delete error:", error);
            if (error.message?.includes("foreign key constraint") || error.code === '23503') {
                alert(`BLOKADA: Gracz ma aktywne misje, których nie udało się usunąć.\n\nOznacza to, że brakuje polityki RLS dla tabeli 'missions'.\nWykonaj SQL:\n\nCREATE POLICY "Admin Delete Missions" ON missions FOR DELETE USING (auth.email() IN ('admin@kosmo.pl', 'admin@kosmo.com'));`);
            } else {
                alert(`Błąd usuwania (DB Error): ${error.message} (Code: ${error.code})`);
            }
        } else if (count === 0) {
            alert(`BŁĄD: Nie usunięto wiersza (Count: 0).\nZablokowane przez RLS tabeli 'profiles'.\nWykonaj SQL:\nCREATE POLICY "Admin All Access" ON profiles FOR ALL USING (auth.email() IN ('admin@kosmo.pl', 'admin@kosmo.com'));`);
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

            <div className="overflow-x-auto bg-gray-900/80 rounded-lg border border-gray-700">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-800 text-gray-400 uppercase text-xs">
                            <th className="p-4 border-b border-gray-700">Nick</th>
                            <th className="p-4 border-b border-gray-700">Planeta</th>
                            <th className="p-4 border-b border-gray-700">Koordynaty</th>
                            <th className="p-4 border-b border-gray-700">Ostatnia Akt.</th>
                            <th className="p-4 border-b border-gray-700 text-right">Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-800/50 transition-colors border-b border-gray-800">
                                <td className="p-4 font-bold text-blue-300">{u.nickname || 'Nieznany'}</td>
                                <td className="p-4">{u.planet_name}</td>
                                <td className="p-4 font-mono text-yellow-500">
                                    {u.galaxy_coords ? `[${u.galaxy_coords.galaxy}:${u.galaxy_coords.system}:${u.galaxy_coords.position}]` : 'BRAK'}
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {u.last_updated ? new Date(u.last_updated).toLocaleString() : '-'}
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => deleteUser(u.id, u.nickname)}
                                        className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white p-2 rounded transition-colors font-bold"
                                        title="Usuń Gracza i Planetę"
                                    >
                                        USUŃ
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && !loading && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Brak użytkowników</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
