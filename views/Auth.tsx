
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { IMAGES } from '../constants';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Pseudo-email strategy
        const fakeEmail = `${nickname.trim()}@kosmo.com`;

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: fakeEmail,
                    password,
                });
                if (error) throw error;
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email: fakeEmail,
                    password,
                    options: {
                        data: {
                            full_name: nickname.trim(), // Save original nick in metadata
                        },
                    },
                });

                if (error) throw error;

                // If no session (confirm email required), alerting user
                if (data.user && !data.session) {
                    // Try to sign in immediately just in case
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                        email: fakeEmail,
                        password,
                    });

                    if (signInError) {
                        // Likely "Email not confirmed"
                        alert('Konto utworzone! Jeśli nie zostałeś zalogowany automatycznie, sprawdź czy wyłączyłeś "Confirm Email" w Supabase lub spróbuj się zalogować.');
                        setIsLogin(true);
                    }
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#101322] relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md p-6 md:p-8 bg-[#1c2136]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl mx-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center mb-8 group">
                    <div className="rounded-full size-24 border-2 border-primary mb-4 shadow-lg shadow-primary/30 overflow-hidden bg-[#111422] transition-transform duration-500 group-hover:scale-110 group-hover:shadow-primary/50 relative">
                        <div className="absolute inset-0 bg-primary/20 animate-pulse z-10 pointer-events-none"></div>
                        <img
                            src={IMAGES.avatar}
                            alt="Logo"
                            className="w-full h-full object-cover relative z-0"
                            onError={(e) => { e.currentTarget.src = '/kosmo/avatars/avatar_default.png'; }}
                        />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight uppercase font-display text-transparent bg-clip-text bg-gradient-to-r from-white to-primary animate-in slide-in-from-top-4 duration-700 delay-150">Kosmo</h1>
                    <p className="text-gray-500 mt-2 animate-in slide-in-from-top-2 duration-700 delay-200">v1.2.5 (PvP & Commander Update)</p>
                    <p className="text-[#929bc9] text-sm md:text-base text-center mt-2 animate-in slide-in-from-top-2 duration-700 delay-300">Zaloguj się do terminala dowódcy</p>
                </div>

                <form onSubmit={handleAuth} className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    <div className="group">
                        <label className="text-xs font-bold text-[#929bc9] uppercase mb-1 block group-focus-within:text-primary transition-colors">Nick Dowódcy</label>
                        <input
                            type="text"
                            required
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full bg-[#111422] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                            placeholder="Wpisz swój nick..."
                        />
                    </div>

                    <div className="group">
                        <label className="text-xs font-bold text-[#929bc9] uppercase mb-1 block group-focus-within:text-primary transition-colors">Hasło</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#111422] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-4 py-3 rounded-lg font-bold uppercase tracking-wider transition-all shadow-lg relative overflow-hidden group
                            ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-primary hover:bg-blue-600 text-white shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5'}
                        `}
                    >
                        <span className="relative z-10">{loading ? 'Przetwarzanie...' : (isLogin ? 'Zaloguj się' : 'Zarejestruj konto')}</span>
                        {!loading && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>}
                    </button>
                </form>

                <div className="mt-6 text-center animate-in fade-in duration-1000 delay-500">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-[#929bc9] hover:text-white transition-colors hover:underline underline-offset-4"
                    >
                        {isLogin ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
                    </button>
                </div>
            </div>

            {/* Version Badge */}
            {/* Author Footer */}
            <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-[#929bc9]/50 font-mono">
                Stworzone przez DareG TV
            </div>
        </div>
    );
};

export default Auth;
