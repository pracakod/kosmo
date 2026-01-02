import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { GameProvider } from './GameContext';
import Layout from './components/Layout';
import Auth from './views/Auth';
import GalaxySetup from './views/GalaxySetup';
import Overview from './views/Overview';
import Buildings from './views/Buildings';
import Shipyard from './views/Shipyard';
import Galaxy from './views/Galaxy';
import Research from './views/Research';
import Fleet from './views/Fleet';
import Shop from './views/Shop';
import Ranking from './views/Ranking';
import Settings from './views/Settings';
import Defense from './views/Defense';
import Clans from './views/Clans';
import { AdminPanel } from './views/AdminPanel';

export type ViewType = 'overview' | 'buildings' | 'research' | 'shipyard' | 'fleet' | 'galaxy' | 'shop' | 'ranking' | 'settings' | 'defense' | 'clans' | 'admin';

const App: React.FC = () => {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [hasGalaxyCoords, setHasGalaxyCoords] = useState<boolean | null>(null);
    const [currentView, setCurrentView] = useState<ViewType>(() => {
        return (localStorage.getItem('currentView') as ViewType) || 'overview';
    });

    useEffect(() => {
        localStorage.setItem('currentView', currentView);
    }, [currentView]);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                if (!session) {
                    setHasGalaxyCoords(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Sprawdź czy użytkownik ma już pozycję w galaktyce
    useEffect(() => {
        const checkGalaxyCoords = async () => {
            if (!session?.user) {
                setHasGalaxyCoords(null);
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('galaxy_coords')
                .eq('id', session.user.id)
                .single();

            if (data && !error && data.galaxy_coords) {
                setHasGalaxyCoords(true);
            } else {
                setHasGalaxyCoords(false);
            }
        };

        checkGalaxyCoords();
    }, [session]);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Ładowanie...</p>
            </div>
        );
    }

    if (!isSupabaseConfigured || !session) {
        return <Auth onLogin={setSession} />;
    }

    // Ładowanie sprawdzania pozycji
    if (hasGalaxyCoords === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#101322]">
                <div className="text-white text-xl">Sprawdzanie pozycji...</div>
            </div>
        );
    }

    // Nowy gracz - wybór pozycji w galaktyce
    if (hasGalaxyCoords === false) {
        return (
            <GalaxySetup
                session={session}
                onComplete={() => setHasGalaxyCoords(true)}
            />
        );
    }

    const renderView = () => {
        switch (currentView) {
            case 'overview': return <Overview onNavigate={(v) => setCurrentView(v as ViewType)} />;
            case 'buildings': return <Buildings />;
            case 'research': return <Research />;
            case 'shipyard': return <Shipyard />;
            case 'fleet': return <Fleet />;
            case 'galaxy': return <Galaxy />;
            case 'shop': return <Shop />;
            case 'ranking': return <Ranking />;
            case 'settings': return <Settings />;
            case 'defense': return <Defense />;
            case 'clans': return <Clans />;
            case 'admin': return <AdminPanel />;
            default: return <Overview onNavigate={(v) => setCurrentView(v as ViewType)} />;
        }
    };

    return (
        <GameProvider session={session}>
            <Layout activeView={currentView} onNavigate={(view) => setCurrentView(view as ViewType)}>
                {renderView()}
            </Layout>
        </GameProvider>
    );
};

export default App;