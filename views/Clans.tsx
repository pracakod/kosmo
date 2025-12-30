
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useGame } from '../GameContext';

interface Clan {
    id: string;
    name: string;
    tag: string;
    leader_id: string;
    member_count: number;
    total_points: number;
    description?: string;
    created_at: string;
}

const Clans: React.FC = () => {
    const { userId, nickname } = useGame();
    const [clans, setClans] = useState<Clan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newClanName, setNewClanName] = useState('');
    const [newClanTag, setNewClanTag] = useState('');

    useEffect(() => {
        // For now, show placeholder data since clans table doesn't exist yet
        setClans([
            { id: '1', name: 'Kosmiczni Łowcy', tag: 'KŁ', leader_id: 'demo', member_count: 12, total_points: 45000, description: 'Elite hunters of the galaxy', created_at: new Date().toISOString() },
            { id: '2', name: 'Gwiezdna Flota', tag: 'GF', leader_id: 'demo2', member_count: 8, total_points: 32000, description: 'United we stand', created_at: new Date().toISOString() },
            { id: '3', name: 'Ciemna Materia', tag: 'CM', leader_id: 'demo3', member_count: 15, total_points: 67000, description: 'Power beyond measure', created_at: new Date().toISOString() },
        ]);
        setLoading(false);
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-[#929bc9]">Ładowanie klanów...</div>;
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-white tracking-widest uppercase">
                    <span className="text-primary">System</span> Klanów
                </h2>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span>
                    Stwórz Klan
                </button>
            </div>

            {/* Create Clan Form */}
            {showCreate && (
                <div className="bg-[#1c2136] rounded-xl border border-primary/30 p-6 mb-6 animate-in slide-in-from-top duration-200">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">groups</span>
                        Nowy Klan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-sm text-[#929bc9] font-bold uppercase block mb-2">Nazwa Klanu</label>
                            <input
                                type="text"
                                value={newClanName}
                                onChange={(e) => setNewClanName(e.target.value)}
                                className="w-full bg-[#111422] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary outline-none"
                                placeholder="np. Kosmiczni Wojownicy"
                                maxLength={24}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-[#929bc9] font-bold uppercase block mb-2">Tag (2-4 znaki)</label>
                            <input
                                type="text"
                                value={newClanTag}
                                onChange={(e) => setNewClanTag(e.target.value.toUpperCase())}
                                className="w-full bg-[#111422] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary outline-none uppercase"
                                placeholder="np. KW"
                                maxLength={4}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex-1 bg-primary hover:bg-blue-600 text-white py-3 rounded-lg font-bold transition-colors">
                            Załóż Klan (Koszt: 1000 Ciemnej Materii)
                        </button>
                        <button
                            onClick={() => setShowCreate(false)}
                            className="px-6 py-3 bg-[#111422] text-[#929bc9] rounded-lg hover:text-white transition-colors"
                        >
                            Anuluj
                        </button>
                    </div>
                </div>
            )}

            {/* Clan List */}
            <div className="grid grid-cols-1 gap-4">
                {clans.sort((a, b) => b.total_points - a.total_points).map((clan, index) => (
                    <div key={clan.id} className="bg-[#1c2136] rounded-xl border border-white/5 p-5 hover:border-primary/30 transition-all group">
                        <div className="flex items-center gap-4">
                            {/* Rank */}
                            <div className={`size-12 rounded-xl flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                    index === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                                        index === 2 ? 'bg-amber-600/20 text-amber-500 border border-amber-600/30' :
                                            'bg-[#111422] text-[#929bc9] border border-white/10'
                                }`}>
                                {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                            </div>

                            {/* Tag */}
                            <div className="size-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                <span className="text-primary font-bold text-sm">[{clan.tag}]</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h3 className="text-white font-bold group-hover:text-primary transition-colors">{clan.name}</h3>
                                <p className="text-[#929bc9] text-xs">{clan.description || 'Brak opisu'}</p>
                            </div>

                            {/* Stats */}
                            <div className="hidden md:flex items-center gap-6 text-sm">
                                <div className="text-center">
                                    <div className="text-[#929bc9] text-xs uppercase">Członkowie</div>
                                    <div className="text-white font-bold">{clan.member_count}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[#929bc9] text-xs uppercase">Punkty</div>
                                    <div className="text-white font-bold font-mono">{clan.total_points.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Join Button */}
                            <button className="bg-[#111422] hover:bg-primary text-[#929bc9] hover:text-white px-4 py-2 rounded-lg font-bold text-sm transition-all border border-white/10 hover:border-primary">
                                Dołącz
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-[#1c2136]/50 rounded-xl border border-white/5 p-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-500">info</span>
                    System Klanów
                </h3>
                <ul className="text-[#929bc9] text-sm space-y-2">
                    <li>• Klany łączą graczy w potężne sojusze kosmiczne.</li>
                    <li>• Członkowie klanu mogą dzielić się zasobami i wspólnie atakować wrogie planety.</li>
                    <li>• Założenie klanu wymaga 1000 Ciemnej Materii.</li>
                    <li>• Ranking klanów opiera się na sumie punktów wszystkich członków.</li>
                </ul>
            </div>
        </div>
    );
};

export default Clans;
