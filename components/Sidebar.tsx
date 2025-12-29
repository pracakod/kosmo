
import React from 'react';
import { useGame } from '../GameContext';

interface SidebarProps {
    activeView: string;
    onNavigate: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
    let resetGame = () => { };
    try {
        const game = useGame();
        resetGame = game.resetGame;
    } catch (e) {
        // Fallback if rendered outside context
    }


    const navItems = [
        { id: 'overview', label: 'Podgląd', icon: 'dashboard' },
        { id: 'buildings', label: 'Budynki', icon: 'domain' },
        { id: 'shipyard', label: 'Stocznia', icon: 'rocket_launch' },
        { id: 'research', label: 'Badania', icon: 'science' },
        { id: 'galaxy', label: 'Galaktyka', icon: 'public' },
        { id: 'fleet', label: 'Flota', icon: 'flight_takeoff' },
        { id: 'shop', label: 'Sklep', icon: 'shopping_cart' }, // Added
        { id: 'defense', label: 'Obrona', icon: 'shield' },
        { id: 'alliance', label: 'Sojusz', icon: 'groups' },
        { id: 'settings', label: 'Opcje', icon: 'settings' }, // Added
    ];

    return (
        <aside className="w-64 flex-shrink-0 flex flex-col bg-[#111422] border-r border-white/5 z-20 hidden lg:flex h-full">
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-primary"
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDYHcygFrQVgyEfnHZ8wIGz0YtsJRZH8J9zYcrzzH9eXprxH5v2no1xcJkgvkqVhynJWlxa4LNUEGsGOr9XVV2pBeecZ9GP1zQHxmBJgARSLSqPgsvxzsQyAaWSeIArMD2QcX8cO_6SOHiNWVH_kg93Xx9QNja_l9jDs1S-lgoSSNvgSbN8UACPK7AKeuS_ncsK-vz67c6whIajlG7hgrbZKLgORRGCUd3eQ6yEkLwyhkmyZPp3YKbcArSwNn-VcSbOlNMpz85EjFU")' }}></div>
                    <div className="flex flex-col">
                        <h1 className="text-white text-base font-bold tracking-tight uppercase">StarCommand</h1>
                        <p className="text-[#929bc9] text-xs font-normal">Kmdr. DareG</p>
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
                    <span className="text-xs text-[#929bc9]/60 font-mono">v1.1.2</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
