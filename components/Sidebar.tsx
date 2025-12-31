
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

    const ADMIN_EMAILS = ['admin@kosmo.pl', 'dareg@kosmo.pl'];
    const userEmail = game.session?.user?.email?.toLowerCase();

    // DEBUG LOG
    console.log("Current Email:", userEmail, "Is Admin?", ADMIN_EMAILS.includes(userEmail));

    if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
        navItems.push({ id: 'admin', label: 'ADMIN', icon: 'shield_person' });
    }

    return (
        <aside className="w-64 flex-shrink-0 flex flex-col bg-[#111422] border-r border-white/5 z-20 hidden lg:flex h-full">
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-primary"
                        style={{ backgroundImage: `url("${avatarUrl}")` }}></div>
                    <div className="flex flex-col">
                        <h1 className="text-white text-base font-bold tracking-tight uppercase">Centrum Dowodzenia</h1>
                        <p className="text-[#929bc9] text-xs font-normal">{userName}</p>
                    </div>
                </div>
            </div>

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
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[#929bc9] text-xs font-bold uppercase tracking-wider">Status: Online</span>
                </div>
                <div className="text-[#555a7a] text-xs font-mono mb-1">v1.2.6 (Admin Debug)</div>
                {/* DEBUG EMAIL DISPLAY */}
                <div className="text-[#555a7a] text-[10px] break-all">
                    {game.session?.user?.email || "No Email"}
                </div>
            </div>
        </aside >
    );
};

export default Sidebar;
