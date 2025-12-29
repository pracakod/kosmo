
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface GalaxySetupProps {
    session: any;
    onComplete: (coords: { galaxy: number; system: number; position: number }) => void;
}

const GalaxySetup: React.FC<GalaxySetupProps> = ({ session, onComplete }) => {
    const [selectedGalaxy, setSelectedGalaxy] = useState(1);
    const [selectedSystem, setSelectedSystem] = useState(1);
    const [selectedPosition, setSelectedPosition] = useState(1);
    const [occupiedPositions, setOccupiedPositions] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pobierz zajęte pozycje
    useEffect(() => {
        const fetchOccupied = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('galaxy_coords')
                .not('galaxy_coords', 'is', null);

            if (data && !error) {
                const occupied = new Set<string>();
                data.forEach((profile: any) => {
                    if (profile.galaxy_coords) {
                        const c = profile.galaxy_coords;
                        occupied.add(`${c.galaxy}:${c.system}:${c.position}`);
                    }
                });
                setOccupiedPositions(occupied);
            }
            setLoading(false);
        };
        fetchOccupied();
    }, []);

    const isPositionOccupied = (g: number, s: number, p: number) => {
        return occupiedPositions.has(`${g}:${s}:${p}`);
    };

    const handleClaim = async () => {
        if (isPositionOccupied(selectedGalaxy, selectedSystem, selectedPosition)) {
            setError('Ta pozycja jest już zajęta! Wybierz inną.');
            return;
        }

        setClaiming(true);
        setError(null);

        const coords = {
            galaxy: selectedGalaxy,
            system: selectedSystem,
            position: selectedPosition
        };

        // Zapisz pozycję w profilu
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: session.user.id,
                galaxy_coords: coords,
                planet_name: `Kolonia [${coords.galaxy}:${coords.system}:${coords.position}]`,
                last_updated: Date.now()
            });

        if (updateError) {
            setError('Błąd przy zapisie pozycji: ' + updateError.message);
            setClaiming(false);
            return;
        }

        onComplete(coords);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#101322]">
                <div className="text-white text-xl">Ładowanie galaktyki...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#101322] relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-lg p-8 bg-[#1c2136]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                <div className="text-center mb-8">
                    <span className="material-symbols-outlined text-6xl text-primary mb-4 block">rocket_launch</span>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-tight">Wybierz swój sektor</h1>
                    <p className="text-[#929bc9] mt-2">Założ kolonię w galaktyce!</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center mb-6">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Galaxy Select */}
                    <div>
                        <label className="text-xs font-bold text-[#929bc9] uppercase mb-2 block">Galaktyka</label>
                        <div className="flex gap-2 flex-wrap">
                            {[1, 2, 3, 4, 5].map(g => (
                                <button
                                    key={g}
                                    onClick={() => setSelectedGalaxy(g)}
                                    className={`px-4 py-2 rounded-lg font-bold transition-all ${selectedGalaxy === g
                                            ? 'bg-primary text-white'
                                            : 'bg-[#111422] text-[#929bc9] hover:bg-white/5'
                                        }`}
                                >
                                    G{g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* System Select */}
                    <div>
                        <label className="text-xs font-bold text-[#929bc9] uppercase mb-2 block">System (1-499)</label>
                        <input
                            type="number"
                            min={1}
                            max={499}
                            value={selectedSystem}
                            onChange={(e) => setSelectedSystem(Math.max(1, Math.min(499, parseInt(e.target.value) || 1)))}
                            className="w-full bg-[#111422] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Position Select */}
                    <div>
                        <label className="text-xs font-bold text-[#929bc9] uppercase mb-2 block">Pozycja (1-15)</label>
                        <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(p => {
                                const isOccupied = isPositionOccupied(selectedGalaxy, selectedSystem, p);
                                return (
                                    <button
                                        key={p}
                                        onClick={() => !isOccupied && setSelectedPosition(p)}
                                        disabled={isOccupied}
                                        className={`px-3 py-2 rounded-lg font-bold transition-all text-sm ${isOccupied
                                                ? 'bg-red-500/20 text-red-400 cursor-not-allowed'
                                                : selectedPosition === p
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-[#111422] text-[#929bc9] hover:bg-white/5'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-[#929bc9] mt-2">🔴 = zajęte, 🟢 = wybrane</p>
                    </div>

                    {/* Preview */}
                    <div className="bg-[#111422] rounded-lg p-4 text-center">
                        <p className="text-xs text-[#929bc9] uppercase mb-1">Twoja lokalizacja</p>
                        <p className="text-2xl font-bold text-white">
                            [{selectedGalaxy}:{selectedSystem}:{selectedPosition}]
                        </p>
                    </div>

                    {/* Claim Button */}
                    <button
                        onClick={handleClaim}
                        disabled={claiming || isPositionOccupied(selectedGalaxy, selectedSystem, selectedPosition)}
                        className={`w-full py-4 rounded-lg font-bold uppercase tracking-wider transition-all shadow-lg ${claiming
                                ? 'bg-gray-600 cursor-not-allowed'
                                : isPositionOccupied(selectedGalaxy, selectedSystem, selectedPosition)
                                    ? 'bg-red-500/20 text-red-400 cursor-not-allowed'
                                    : 'bg-primary hover:bg-blue-600 text-white shadow-primary/20'
                            }`}
                    >
                        {claiming ? 'Zakładam kolonię...' : '🚀 Załóż kolonię!'}
                    </button>
                </div>
            </div>

            {/* Version Badge */}
            <div className="absolute bottom-4 right-4 text-xs text-[#929bc9]/50 font-mono">
                v1.1.0
            </div>
        </div>
    );
};

export default GalaxySetup;
