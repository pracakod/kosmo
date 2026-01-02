
import React from 'react';
import { useGame } from '../GameContext';

interface SidebarProps {
    activeView: string;
    onNavigate: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
    const game = useGame();

    // Safely derive values
    const resetGame = game?.resetGame || (() => { });
    const avatarUrl = game?.avatarUrl || "/kosmo/avatars/avatar_default.png";
    const userName = game?.nickname || (game?.userId ? `Kmdr. ${game.userId.split('-')[0]}` : "Kmdr. DareG");

    const navItems = [
        { id: 'overview', label: 'Podgląd', icon: 'dashboard' },
        { id: 'buildings', label: 'Budynki', icon: 'domain' },
        { id: 'shipyard', label: 'Stocznia', icon: 'rocket_launch' },
        { id: 'research', label: 'Badania', icon: 'science' },
        { id: 'galaxy', label: 'Galaktyka', icon: 'public' },
        { id: 'fleet', label: 'Flota', icon: 'flight_takeoff' },
        { id: 'shop', label: 'Sklep', icon: 'shopping_cart' },
        { id: 'defense', label: 'Obrona', icon: 'shield' },
        { id: 'clans', label: 'Klany', icon: 'groups' },
        { id: 'ranking', label: 'Ranking', icon: 'leaderboard' },
        { id: 'settings', label: 'Opcje', icon: 'settings' },
    ];

    const ADMIN_EMAILS = ['admin@kosmo.pl', 'dareg@kosmo.pl', 'admin@kosmo.com'];
    const userEmail = game.session?.user?.email?.toLowerCase();

    // DEBUG LOG


    if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
        navItems.push({ id: 'admin', label: 'ADMIN', icon: 'shield_person' });
    }

    return (
        <aside className="w-64 flex-shrink-0 flex flex-col bg-[#111422] border-r border-white/5 z-20 hidden lg:flex h-full">
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 aspect-square bg-center bg-no-repeat bg-cover rounded-full border-2 border-primary"
                        style={{ backgroundImage: `url("${avatarUrl}")` }}></div>
                    <div className="flex flex-col">
                        <h1 className="text-white text-base font-bold tracking-tight uppercase">Centrum Dowodzenia</h1>
                        <p className="text-[#929bc9] text-xs font-normal">{userName}</p>

                    </div>
                </div>
            </div>

            {/* Planet Switcher */}
            {game.planets && game.planets.length > 0 && (
                <div className="mx-4 mt-4 p-3 bg-[#1a1f35] border border-white/10 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[#929bc9] uppercase font-bold">Twoje Planety</span>
                        <span className="text-xs text-primary">{game.planets.length + 1}/9</span>
                    </div>

                    {/* Main Planet (from profile) */}
                    <button
                        onClick={() => game.switchPlanet('main')}
                        className={`w-full text-left px-3 py-2 rounded mb-1 text-sm transition-colors ${!game.currentPlanetId || game.currentPlanetId === 'main'
                            ? 'bg-primary/20 text-white border border-primary/50'
                            : 'bg-white/5 text-[#929bc9] hover:bg-white/10 border border-transparent'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">home</span>
                            <span className="truncate">{game.mainPlanetName || game.planetName}</span>
                            {game.galaxyCoords && (
                                <span className="text-xs text-gray-500 ml-auto">[{game.galaxyCoords.galaxy}:{game.galaxyCoords.system}:{game.galaxyCoords.position}]</span>
                            )}
                        </div>
                    </button>

                    {/* Colony Planets */}
                    {game.planets.map(planet => (
                        <button
                            key={planet.id}
                            onClick={() => game.switchPlanet(planet.id)}
                            className={`w-full text-left px-3 py-2 rounded mb-1 text-sm transition-colors ${game.currentPlanetId === planet.id
                                ? 'bg-primary/20 text-white border border-primary/50'
                                : 'bg-white/5 text-[#929bc9] hover:bg-white/10 border border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">public</span>
                                <span className="truncate">{planet.planet_name}</span>
                                <span className="text-xs text-gray-500 ml-auto">[{planet.galaxy_coords?.galaxy}:{planet.galaxy_coords?.system}:{planet.galaxy_coords?.position}]</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
            {/* Attack Alert */}
            {
                game.incomingMissions && game.incomingMissions.length > 0 && (
                    <div className="mx-4 mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg animate-pulse flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                        <span className="material-symbols-outlined text-red-500 animate-bounce">warning</span>
                        <div>
                            <div className="text-red-400 text-xs font-bold uppercase tracking-wider">Uwaga!</div>
                            <div className="text-white text-xs font-medium">Nadciąga Wróg!</div>
                        </div>
                    </div>
                )
            }

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = activeView === item.id;
                    const isShop = item.id === 'shop';
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${isActive
                                ? 'bg-primary/20 text-white border border-primary/50 shadow-[0_0_15px_rgba(19,55,236,0.3)]'
                                : 'text-[#929bc9] hover:bg-white/5 hover:text-white'
                                } ${isShop ? 'text-yellow-400 hover:text-yellow-300' : ''}`}
                        >
                            <span className={`material-symbols-outlined ${isActive ? 'text-primary' : isShop ? 'text-yellow-500' : 'group-hover:text-primary transition-colors'}`}>
                                {item.icon}
                            </span>
                            <span className="text-sm font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${game.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'} `}></div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${game.isOnline ? 'text-[#929bc9]' : 'text-red-500'}`}>
                        {game.isOnline ? 'Status: Online' : 'Status: Offline'}
                    </span>
                </div>
                <div className="text-white text-sm font-medium mb-1">{userName}</div>
                <div className="text-[#555a7a] text-xs font-mono">v1.2.8</div>
            </div>
        </aside >
    );
};

export default Sidebar;
