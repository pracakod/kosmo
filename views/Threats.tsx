import React from 'react';
import { useGame } from '../GameContext';
import { formatTime } from '../constants';

const Threats: React.FC = () => {
    const { missionLogs, incomingMissions, clearLogs } = useGame();

    // Filter logs that are "danger" type - these are threats (spying, canceled attacks, incoming attacks)
    const threatLogs = missionLogs.filter(log =>
        log.outcome === 'danger' ||
        String(log.outcome) === 'info' ||
        log.title?.toLowerCase().includes('atak') ||
        log.title?.toLowerCase().includes('skan') ||
        log.title?.toLowerCase().includes('wykryto')
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-red-500">crisis_alert</span>
                    Zagrożenia
                </h2>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-[#929bc9]">
                        {threatLogs.length} {threatLogs.length === 1 ? 'wpis' : 'wpisów'}
                    </span>
                </div>
            </div>

            {/* Active Incoming Attacks */}
            {incomingMissions && incomingMissions.length > 0 && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 animate-pulse">
                    <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined animate-bounce">warning</span>
                        AKTYWNE ATAKI PRZYCHODZĄCE
                    </h3>
                    <div className="flex flex-col gap-3">
                        {incomingMissions.map(mission => {
                            const now = Date.now();
                            const timeToArrival = Math.max(0, Math.floor((mission.arrivalTime - now) / 1000));
                            return (
                                <div key={mission.id} className="bg-black/40 rounded-lg p-4 border border-red-500/30">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white font-bold">
                                            {mission.type === 'attack' ? '⚔️ Atak' : mission.type === 'spy' ? '🔍 Szpieg' : '🚀 Misja'}
                                        </span>
                                        <span className="text-red-400 font-mono text-lg">{formatTime(timeToArrival)}</span>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        Z: <span className="text-white">[{mission.originCoords?.galaxy}:{mission.originCoords?.system}:{mission.originCoords?.position}]</span>
                                    </div>
                                    {mission.ships && (
                                        <div className="text-xs text-gray-500 mt-2">
                                            Flota: {Object.entries(mission.ships).map(([id, count]) => `${id}: ${count}`).join(', ')}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Threat History */}
            <div className="bg-[#1c2136] rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-bold text-[#929bc9] uppercase mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">history</span>
                    Historia Zagrożeń
                </h3>

                {threatLogs.length === 0 ? (
                    <div className="text-center py-12 text-[#929bc9]">
                        <span className="material-symbols-outlined text-5xl mb-4 block opacity-30">verified_user</span>
                        <p>Brak zarejestrowanych zagrożeń.</p>
                        <p className="text-xs mt-2 opacity-60">Gdy ktoś Cię zaatakuje, prześledzi lub anuluje atak - pojawi się tutaj.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto">
                        {threatLogs.map(log => (
                            <div
                                key={log.id}
                                className={`p-4 rounded-lg border ${log.outcome === 'danger'
                                    ? 'bg-red-900/20 border-red-500/30'
                                    : 'bg-yellow-900/20 border-yellow-500/30'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined ${log.title?.toLowerCase().includes('skan') ? 'text-blue-400' :
                                            log.title?.toLowerCase().includes('anulowany') ? 'text-yellow-400' :
                                                'text-red-400'
                                            }`}>
                                            {log.title?.toLowerCase().includes('skan') ? 'visibility' :
                                                log.title?.toLowerCase().includes('anulowany') ? 'cancel' :
                                                    'swords'}
                                        </span>
                                        <span className="text-white font-bold">{log.title}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {new Date(log.timestamp).toLocaleString('pl-PL')}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-300 whitespace-pre-line">{log.message}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Panel */}
            <div className="bg-[#1c2136] rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-bold text-[#929bc9] uppercase mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Informacje
                </h3>
                <div className="text-xs text-gray-400 space-y-2">
                    <p>• <span className="text-blue-400">Wykryto Skanowanie</span> - Ktoś wysłał sondy szpiegowskie na Twoją planetę.</p>
                    <p>• <span className="text-yellow-400">Atak Anulowany</span> - Gracz wysłał flotę, ale zawrócił przed dotarciem.</p>
                    <p>• <span className="text-red-400">Atak</span> - Przychodzący atak - przygotuj obronę!</p>
                </div>
            </div>
        </div>
    );
};

export default Threats;
