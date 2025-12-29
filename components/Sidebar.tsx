
import React from 'react';
import { useGame } from '../GameContext';

interface SidebarProps {
    activeView: string;
    onNavigate: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
    let resetGame = () => { };
    let avatarUrl = "/kosmo/avatars/avatar_default.png";
    let userName = "Kmdr. DareG";

    try {
        const game = useGame();
        resetGame = game.resetGame;
        if (game.avatarUrl) avatarUrl = game.avatarUrl;
        if (game.userId) userName = `Kmdr. ${game.userId.split('-')[0]}`;
    } catch (e) {
        // Fallback
    }

    const navItems = [
        { id: 'overview', label: 'Podgląd', icon: 'dashboard' },
        { id: 'buildings', label: 'Budynki', icon: 'domain' },
        { id: 'shipyard', label: 'Stocznia', icon: 'rocket_launch' },
        { id: 'research', label: 'Badania', icon: 'science' },
        { id: 'galaxy', label: 'Galaktyka', icon: 'public' },
        { id: 'fleet', label: 'Flota', icon: 'flight_takeoff' },
        { id: 'shop', label: 'Sklep', icon: 'shopping_cart' },
        { id: 'defense', label: 'Obrona', icon: 'shield' },
        { id: 'alliance', label: 'Sojusz', icon: 'groups' },
        { id: 'settings', label: 'Opcje', icon: 'settings' },
    ];

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

            <div className="p-4 border-t border-white/5 flex flex-col gap-2">
                <div className="bg-[#232948] rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-[#929bc9]">Status: Online</span>
                    </div>
                    <span className="text-xs text-[#929bc9]/60 font-mono">v1.2.0 (PvP)</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
