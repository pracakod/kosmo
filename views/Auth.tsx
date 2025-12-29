
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Rejestracja udana! Możesz się teraz zalogować.');
                setIsLogin(true);
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

            <div className="relative z-10 w-full max-w-md p-8 bg-[#1c2136]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-center bg-no-repeat bg-cover rounded-full size-20 border-2 border-primary mb-4 shadow-lg shadow-primary/30"
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDYHcygFrQVgyEfnHZ8wIGz0YtsJRZH8J9zYcrzzH9eXprxH5v2no1xcJkgvkqVhynJWlxa4LNUEGsGOr9XVV2pBeecZ9GP1zQHxmBJgARSLSqPgsvxzsQyAaWSeIArMD2QcX8cO_6SOHiNWVH_kg93Xx9QNja_l9jDs1S-lgoSSNvgSbNn-VcSbOlNMpz85EjFU")' }}></div>
                    <h1 className="text-3xl font-bold text-white tracking-tight uppercase">StarCommand</h1>
                    <p className="text-gray-500 mt-4">v1.2.0 (PvP Alpha)</p>
                    <p className="text-[#929bc9] text-sm">Zaloguj się do terminala dowódcy</p>
                </div>

                <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-[#929bc9] uppercase mb-1 block">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#111422] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="dowodca@flota.pl"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-[#929bc9] uppercase mb-1 block">Hasło</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#111422] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-4 py-3 rounded-lg font-bold uppercase tracking-wider transition-all shadow-lg
                            ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-primary hover:bg-blue-600 text-white shadow-primary/20'}
                        `}
                    >
                        {loading ? 'Przetwarzanie...' : (isLogin ? 'Zaloguj się' : 'Zarejestruj konto')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-[#929bc9] hover:text-white transition-colors"
                    >
                        {isLogin ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
                    </button>
                </div>
            </div>

            {/* Version Badge */}
            <div className="absolute bottom-4 right-4 text-xs text-[#929bc9]/50 font-mono">
                v1.1.4
            </div>
        </div>
    );
};

export default Auth;
