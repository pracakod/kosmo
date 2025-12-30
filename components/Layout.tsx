
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ResourceHeader from './ResourceHeader';
import { useGame } from '../GameContext';
import { formatTime } from '../constants';

interface LayoutProps {
    children: React.ReactNode;
    activeView: string;
    onNavigate: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const game = useGame();
    const logout = game?.logout || (() => window.location.reload());
    const incomingMissions = game?.incomingMissions || [];

    const bottomNavItems = [
        { id: 'overview', icon: 'dashboard', label: 'Podgląd' },
        { id: 'buildings', icon: 'domain', label: 'Budynki' },
        { id: 'fleet', icon: 'flight_takeoff', label: 'Flota' },
        { id: 'galaxy', icon: 'public', label: 'Galaktyka' },
    ];

    const fullNavItems = [
        { id: 'overview', label: 'Podgląd', icon: 'dashboard' },
        { id: 'buildings', label: 'Budynki', icon: 'domain' },
        { id: 'shipyard', label: 'Stocznia', icon: 'rocket_launch' },
        { id: 'research', label: 'Badania', icon: 'science' },
        { id: 'fleet', label: 'Centrum Floty', icon: 'flight_takeoff' },
        { id: 'galaxy', label: 'Galaktyka', icon: 'public' },
        { id: 'defense', label: 'Obrona', icon: 'shield' },
        { id: 'clans', label: 'Klany', icon: 'groups' },
        { id: 'shop', label: 'Sklep Premium', icon: 'shopping_cart' },
        { id: 'ranking', label: 'Ranking', icon: 'leaderboard' },
        { id: 'settings', label: 'Opcje', icon: 'settings' },
    ];

    const handleMobileNavigate = (view: string) => {
        onNavigate(view);
        setIsMenuOpen(false);
    };

    return (
        <div className="flex h-screen w-full bg-[#101322] text-white font-display overflow-hidden relative">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 pointer-events-none z-0" style={{
                backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
                backgroundSize: '40px 40px'
            }}></div>

            <Sidebar activeView={activeView} onNavigate={onNavigate} />

            <main className="flex-1 flex flex-col h-full relative z-10 overflow-hidden mb-16 lg:mb-0">
                <ResourceHeader />

                {/* Global Attack Alert - visible on ALL pages */}
                {incomingMissions && incomingMissions.length > 0 && (
                    <div className="mx-2 md:mx-6 lg:mx-8 mt-2 bg-red-900/80 border-2 border-red-500 rounded-xl p-4 flex items-center justify-between animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-500 text-4xl animate-bounce">warning</span>
                            <div>
                                <h3 className="text-red-400 font-bold text-lg uppercase tracking-wider">⚠️ WYKRYTO ZAGROŻENIE!</h3>
                                <p className="text-red-200 text-sm">
                                    {incomingMissions.length} wroga flota nadciąga! Przygotuj obronę!
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-red-300 text-xs uppercase">Kontakt za:</div>
                            <div className="text-red-400 font-bold text-xl font-mono">
                                {formatTime(Math.max(0, (incomingMissions[0].arrivalTime - Date.now()) / 1000))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-2 md:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-primary scrollbar-track-background-dark">
                    <div className="max-w-[1400px] mx-auto pb-20 lg:pb-0">
                        {children}
                    </div>
                </div>
            </main>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-[#101322]/95 backdrop-blur-xl flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-200">
                    <div className="p-6 flex items-center justify-between border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="bg-center bg-no-repeat bg-cover rounded-full size-12 border-2 border-primary"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDYHcygFrQVgyEfnHZ8wIGz0YtsJRZH8J9zYcrzzH9eXprxH5v2no1xcJkgvkqVhynJWlxa4LNUEGsGOr9XVV2pBeecZ9GP1zQHxmBJgARSLSqPgsvxzsQyAaWSeIArMD2QcX8cO_6SOHiNWVH_kg93Xx9QNja_l9jDs1S-lgoSSNvgSbN8UACPK7AKeuS_ncsK-vz67c6whIajlG7hgrbZKLgORRGCUd3eQ6yEkLwyhkmyZPp3YKbcArSwNn-VcSbOlNMpz85EjFU")' }}></div>
                            <div className="flex flex-col">
                                <h1 className="text-white text-lg font-bold tracking-tight uppercase">Centrum Dowodzenia</h1>
                                <p className="text-[#929bc9] text-sm font-normal">Kmdr. DareG</p>
                            </div>
                        </div>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-white/5 rounded-full text-white">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 overscroll-y-contain touch-action-manipulation pb-24">
                        {fullNavItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleMobileNavigate(item.id)}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${activeView === item.id
                                    ? 'bg-primary/20 border-primary text-white'
                                    : 'bg-[#1c2136] border-white/5 text-[#929bc9] hover:bg-white/5'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-3xl mb-2 ${item.id === 'shop' ? 'text-yellow-500' : ''}`}>{item.icon}</span>
                                <span className="text-sm font-bold">{item.label}</span>
                            </button>
                        ))}

                        {/* Logout Button Mobile */}
                        <button
                            onClick={() => logout()}
                            className="flex flex-col items-center justify-center p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 col-span-2 mt-4"
                        >
                            <span className="material-symbols-outlined text-3xl mb-2">logout</span>
                            <span className="text-sm font-bold">Wyloguj Się</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1c2136]/95 backdrop-blur-md border-t border-white/10 z-50 pb-safe">
                <div className="flex justify-around items-center h-16 px-1">
                    {bottomNavItems.map((item) => {
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { onNavigate(item.id); setIsMenuOpen(false); }}
                                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-primary' : 'text-[#929bc9] hover:text-white'
                                    }`}
                            >
                                <span className={`material-symbols-outlined transition-transform ${isActive ? 'scale-110' : ''} text-2xl`}>
                                    {item.icon}
                                </span>
                                <span className="text-[10px] font-medium leading-none">{item.label}</span>
                            </button>
                        );
                    })}

                    {/* Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isMenuOpen ? 'text-white' : 'text-[#929bc9] hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-2xl">menu</span>
                        <span className="text-[10px] font-medium leading-none">Menu</span>
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default Layout;
