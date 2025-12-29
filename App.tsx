
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { GameProvider } from './GameContext';
import Layout from './components/Layout';
import Auth from './views/Auth';
import Overview from './views/Overview';
import Buildings from './views/Buildings';
import Shipyard from './views/Shipyard';
import Galaxy from './views/Galaxy';
import Research from './views/Research';
import Fleet from './views/Fleet';
import Shop from './views/Shop';
import Settings from './views/Settings';

export type ViewType = 'overview' | 'buildings' | 'research' | 'shipyard' | 'fleet' | 'galaxy' | 'shop' | 'settings';

const App: React.FC = () => {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<ViewType>('overview');

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
            }
        );

        return () => subscription.unsubscribe();
    }, []);

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

    const renderView = () => {
        switch (currentView) {
            case 'overview': return <Overview />;
            case 'buildings': return <Buildings />;
            case 'research': return <Research />;
            case 'shipyard': return <Shipyard />;
            case 'fleet': return <Fleet />;
            case 'galaxy': return <Galaxy />;
            case 'shop': return <Shop />;
            case 'settings': return <Settings />;
            default: return <Overview />;
        }
    };

    return (
        <GameProvider session={session}>
            <Layout currentView={currentView} onViewChange={setCurrentView}>
                {renderView()}
            </Layout>
        </GameProvider>
    );
};

export default App;