
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { IMAGES } from '../constants'; // Zakładam że IMAGES jest wyeksportowane

interface GalaxySetupProps {
    session: any;
    onComplete: (coords: { galaxy: number; system: number; position: number }) => void;
}

const GalaxySetup: React.FC<GalaxySetupProps> = ({ session, onComplete }) => {
    const [coords, setCoords] = useState({ galaxy: 1, system: 1 });
    const [occupiedPositions, setOccupiedPositions] = useState<Map<string, string>>(new Map()); // "g:s:p" -> "PlayerName"
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Pobierz zajęte pozycje dla CAŁEGO systemu (lub zcache'owane)
    useEffect(() => {
        const fetchOccupied = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('galaxy_coords, planet_name')
                .not('galaxy_coords', 'is', null);

            if (data && !error) {
                const occupied = new Map<string, string>();
                data.forEach((profile: any) => {
                    if (profile.galaxy_coords) {
                        const c = profile.galaxy_coords;
                        occupied.set(`${c.galaxy}:${c.system}:${c.position}`, profile.planet_name || "Nieznana Planeta");
                    }
                });
                // Add Bot Base manually for specific coords (e.g. 1:1:2 like in Galaxy.tsx)
                occupied.set("1:1:2", "Piracka Baza");

                setOccupiedPositions(occupied);
            }
            setLoading(false);
        };
        fetchOccupied();
    }, []); // Refresh only on mount for now, or could refresh on system change if optimized

    const isPositionOccupied = (pos: number) => {
        return occupiedPositions.has(`${coords.galaxy}:${coords.system}:${pos}`);
    };

    const getOccupantName = (pos: number) => {
        return occupiedPositions.get(`${coords.galaxy}:${coords.system}:${pos}`);
    }

    const handleClaim = async (position: number) => {
        if (claiming) return;
        if (isPositionOccupied(position)) return;

        setClaiming(position);
        setError(null);

        const newCoords = {
            galaxy: coords.galaxy,
            system: coords.system,
            position: position
        };

        // Zapisz pozycję w profilu
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: session.user.id,
                galaxy_coords: newCoords,
                planet_name: `Kolonia [${newCoords.galaxy}:${newCoords.system}:${newCoords.position}]`,
                last_updated: Date.now()
            });

        if (updateError) {
            setError('Błąd przy zapisie pozycji: ' + updateError.message);
            setClaiming(null);
            return;
        }

        onComplete(newCoords);
    };

    const changeSystem = (delta: number) => {
        setCoords(prev => {
            const next = prev.system + delta;
            if (next < 1) return prev;
            if (next > 499) return prev;
            return { ...prev, system: next };
        });
    };

    const changeGalaxy = (delta: number) => {
        setCoords(prev => {
            const next = prev.galaxy + delta;
            if (next < 1) return prev;
            if (next > 9) return prev;
            return { ...prev, galaxy: next };
        });
    }

    const slots = Array.from({ length: 15 }, (_, i) => i + 1);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#101322] flex-col gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="text-white text-xl">Skanowanie Galaktyki...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#101322] overflow-y-auto">
            <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6 pb-20 relative min-h-full">

                {/* Intro Header */}
                <div className="text-center py-8">
                    <h1 className="text-3xl font-bold text-white uppercase tracking-tight mb-2">Wybierz miejsce pod kolonię</h1>
                    <p className="text-[#929bc9]">Znajdź wolną planetę w dowolnym układzie i kliknij "Zasiedl".</p>
                    {error && <div className="mt-4 p-3 bg-red-500/20 text-red-400 rounded-lg">{error}</div>}
                </div>

                {/* Solar System Visual - Background Effect */}
                <div className="absolute top-40 left-1/2 -translate-x-1/2 pointer-events-none z-0 opacity-40 w-full flex justify-center overflow-hidden">
                    <div className="w-[600px] h-[600px] rounded-full bg-blue-500/20 blur-[120px] -translate-y-1/2"></div>
                </div>

                {/* Navigation Header */}
                <div className="bg-[#1c2136] p-4 rounded-xl border border-white/10 shadow-lg sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

                        {/* Coordinates Control */}
                        <div className="flex gap-2 w-full justify-center">
                            <div className="flex flex-col gap-1 w-32 md:w-40">
                                <span className="text-[10px] uppercase font-bold text-[#929bc9] tracking-wider text-center">Galaktyka</span>
                                <div className="flex items-center h-10 md:h-12 bg-[#111422] rounded-lg border border-white/10 overflow-hidden">
                                    <button onClick={() => changeGalaxy(-1)} className="w-8 md:w-10 h-full hover:bg-white/5 active:bg-white/10 flex items-center justify-center text-[#929bc9]">
                                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                                    </button>
                                    <div className="flex-1 text-center font-mono font-bold text-lg text-white">{coords.galaxy}</div>
                                    <button onClick={() => changeGalaxy(1)} className="w-8 md:w-10 h-full hover:bg-white/5 active:bg-white/10 flex items-center justify-center text-[#929bc9]">
                                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 w-32 md:w-40">
                                <span className="text-[10px] uppercase font-bold text-[#929bc9] tracking-wider text-center">Układ</span>
                                <div className="flex items-center h-10 md:h-12 bg-[#111422] rounded-lg border border-white/10 overflow-hidden">
                                    <button onClick={() => changeSystem(-1)} className="w-8 md:w-10 h-full hover:bg-white/5 active:bg-white/10 flex items-center justify-center text-[#929bc9]">
                                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                                    </button>
                                    <div className="flex-1 text-center font-mono font-bold text-lg text-white">{coords.system}</div>
                                    <button onClick={() => changeSystem(1)} className="w-8 md:w-10 h-full hover:bg-white/5 active:bg-white/10 flex items-center justify-center text-[#929bc9]">
                                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Planet Grid */}
                <div className="flex flex-col gap-3 relative z-10">
                    {slots.map((pos) => {
                        const occupied = isPositionOccupied(pos);
                        const occupantName = getOccupantName(pos);
                        const isPirate = coords.galaxy === 1 && coords.system === 1 && pos === 2; // Hardcoded pirate base

                        return (
                            <div key={pos} className={`relative flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border transition-all ${occupied ? 'bg-[#1a2342]/50 border-red-500/20' : 'bg-[#1c2136] border-white/5 hover:border-green-500/30 hover:bg-[#1c2136]/80'}`}>

                                {/* Position Number */}
                                <div className="flex flex-col items-center justify-center w-6 md:w-8 text-[#929bc9] font-mono text-xs md:text-sm opacity-50">
                                    {pos}
                                </div>

                                {/* Planet Visual */}
                                <div className="shrink-0">
                                    {occupied ? (
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg relative overflow-hidden bg-black/20 opacity-80 grayscale-[0.5]">
                                            <img src={isPirate ? "https://lh3.googleusercontent.com/aida-public/AB6AXuCttLEph3WsOd3HRlZC0zxgyo5HtGQLhoc_Nr46u_bMbqY6nTEQYuIV_gyR_hpfVBS-J_jj5GGZynbPPZti1oj5iZ3eOY_YBYNi3q8nw6c4ebgmqCgJnaJhFtJwFfpNu4nYT65VMgmQkWQU-ek95Y5Ue6RnI9LCcYQpDhod0Y_eUiJYtnqiu9_aD-u_ukPsujkP5hgKqFchbR8vhUje3E-LrA80lMR4QTQEfNKXUDobsJRFGe11_CQSYumUsrXBnYunhGfRGvl2epw" : IMAGES.planet} alt="Planet" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 rounded-full bg-red-500/10"></div>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-white text-base">add_location</span>
                                        </div>
                                    )}
                                </div>

                                {/* Planet Info */}
                                <div className="flex-1 min-w-0">
                                    {occupied ? (
                                        <div className="flex flex-col justify-center">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-sm md:text-base truncate text-white">
                                                    {occupantName}
                                                </span>
                                                <span className="text-red-400 text-xs uppercase font-bold tracking-wider">
                                                    ZAJĘTE
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col justify-center">
                                            <span className="text-green-400 text-sm font-bold">Wolna przestrzen</span>
                                            <span className="text-[#929bc9] text-xs">Planeta gotowa do kolonizacji</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    {!occupied && (
                                        <button
                                            onClick={() => handleClaim(pos)}
                                            disabled={claiming !== null}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider shadow-lg transition-all ${claiming === pos ? 'bg-white text-black animate-pulse' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                                        >
                                            {claiming === pos ? 'Zasiedlanie...' : 'Zasiedl'}
                                        </button>
                                    )}
                                    {occupied && (
                                        <span className="material-symbols-outlined text-white/10">lock</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Version Badge */}
            <div className="fixed bottom-4 right-4 text-xs text-[#929bc9]/50 font-mono z-50">
                v1.1.2
            </div>
        </div>
    );
};

export default GalaxySetup;
