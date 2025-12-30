
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { IMAGES } from '../constants';

interface RankedPlayer {
    id: string;
    points: number;
    avatar_url?: string;
    production_settings?: any;
    planet_name?: string;
    nickname?: string;
    galaxy_coords?: { galaxy: number; system: number; position: number };
}

const Ranking: React.FC = () => {
    const [players, setPlayers] = useState<RankedPlayer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, points, production_settings, planet_name, galaxy_coords, nickname')
                    .order('points', { ascending: false })
                    .limit(50);

                console.log('Ranking data:', data, 'error:', error);

                if (data && !error) {
                    // Map data to extract avatar and user info
                    const mapped = data.map((p: any) => ({
                        id: p.id,
                        points: p.points || 0,
                        avatar_url: p.production_settings?.avatarUrl || IMAGES.avatar,
                        planet_name: p.planet_name || 'Nieznana Planeta',
                        nickname: p.nickname || p.production_settings?.nickname || `Dowódca ${p.id.substring(0, 6)}`,
                        galaxy_coords: p.galaxy_coords
                    }));
                    setPlayers(mapped);
                } else if (error) {
                    console.error('Error fetching ranking:', error);
                }
            } catch (err) {
                console.error('Ranking fetch error:', err);
            }
            setLoading(false);
        };

        fetchRanking();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-[#929bc9]">Ładowanie danych wywiadu...</div>;
    }

    if (players.length === 0) {
        return (
            <div className="animate-in fade-in duration-500">
                <h2 className="text-2xl font-bold mb-6 text-white tracking-widest uppercase border-b border-white/10 pb-4">
                    <span className="text-primary">System</span> Rankingowy
                </h2>
                <div className="bg-[#1c2136] rounded-xl border border-white/10 p-8 text-center">
                    <span className="material-symbols-outlined text-[#929bc9] text-5xl mb-4">leaderboard</span>
                    <h3 className="text-xl font-bold text-white mb-2">Brak graczy w rankingu</h3>
                    <p className="text-[#929bc9]">Ranking jest pusty. Rozwijaj swoją kolonię, aby pojawić się na liście!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold mb-6 text-white tracking-widest uppercase border-b border-white/10 pb-4">
                <span className="text-primary">System</span> Rankingowy
            </h2>

            <div className="bg-[#1c2136]/50 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#111422]/80 text-[#929bc9] text-xs uppercase tracking-wider border-b border-white/5">
                                <th className="p-4 font-bold text-center w-16">#</th>
                                <th className="p-4 font-bold">Dowódca</th>
                                <th className="p-4 font-bold text-center">Poziom</th>
                                <th className="p-4 font-bold hidden md:table-cell">Planeta</th>
                                <th className="p-4 font-bold text-right">Punkty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {players.map((player, index) => {
                                const isTop3 = index < 3;
                                const rankColor = index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-[#929bc9]';
                                const level = Math.floor(player.points / 1000) + 1;

                                return (
                                    <tr key={player.id} className="hover:bg-white/5 transition-colors group">
                                        <td className={`p-4 text-center font-bold ${rankColor} text-lg`}>
                                            {isTop3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full border border-white/10 overflow-hidden bg-[#111422]">
                                                    <img
                                                        src={player.avatar_url}
                                                        alt="Avatar"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.currentTarget.src = '/kosmo/avatars/avatar_default.png'; }}
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white group-hover:text-primary transition-colors">
                                                        {player.nickname}
                                                    </span>
                                                    <span className="text-xs text-[#929bc9] md:hidden">{player.planet_name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-mono text-green-400 font-bold">
                                            {level}
                                        </td>
                                        <td className="p-4 text-[#929bc9] font-mono text-sm hidden md:table-cell">
                                            {player.planet_name}
                                        </td>
                                        <td className="p-4 text-right font-bold font-mono text-white text-lg">
                                            {player.points.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Ranking;
