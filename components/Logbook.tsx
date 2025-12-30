import React, { useState, useMemo } from 'react';
import { useGame } from '../GameContext';
import { MissionLog, MissionType, ShipId, DefenseId } from '../types';
import { SHIPS, DEFENSES, formatTime } from '../constants';

const Logbook: React.FC = () => {
    const { missionLogs, clearLogs } = useGame();
    const [activeTab, setActiveTab] = useState<'all' | 'attack' | 'spy' | 'expedition' | 'transport'>('all');
    const [selectedDetail, setSelectedDetail] = useState<MissionLog | null>(null);

    // Helpers
    const getLogType = (log: MissionLog): 'attack' | 'spy' | 'expedition' | 'transport' | 'other' => {
        const t = log.title?.toLowerCase() || '';
        if (t.includes('bojowy') || t.includes('atak')) return 'attack';
        if (t.includes('szpieg') || t.includes('skan')) return 'spy';
        if (t.includes('ekspedycja') || t.includes('przestrzeń') || t.includes('pus') || t.includes('zasoby') || t.includes('pirat') || t.includes('obłok') || t.includes('znalez') || t.includes('statki') || t.includes('artefakt') || t.includes('materia')) return 'expedition';
        if (t.includes('transport') || t.includes('dostarcz') || t.includes('surow')) return 'transport';
        return 'other';
    };

    const filteredLogs = useMemo(() => {
        if (activeTab === 'all') return missionLogs;
        return missionLogs.filter(log => getLogType(log) === activeTab);
    }, [missionLogs, activeTab]);

    const TABS = [
        { id: 'all', label: 'Wszystkie', icon: 'history' },
        { id: 'attack', label: 'Ataki', icon: 'swords' },
        { id: 'spy', label: 'Szpiegowskie', icon: 'visibility' },
        { id: 'expedition', label: 'Ekspedycje', icon: 'rocket_launch' },
        { id: 'transport', label: 'Transport', icon: 'local_shipping' },
    ];

    return (
        <div className="bg-[#1c2136] rounded-xl border border-white/10 shadow-lg flex flex-col h-[600px]">
            {/* Header / Tabs */}
            <div className="flex flex-col border-b border-white/10 bg-[#15192b]">
                <div className="p-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">menu_book</span>
                        Dziennik Pokładowy
                    </h3>
                    {missionLogs.length > 0 && (
                        <button onClick={clearLogs} className="text-xs text-red-400 hover:text-white px-3 py-1 rounded border border-white/5 hover:bg-red-500/20 transition-colors">
                            Wyczyść
                        </button>
                    )}
                </div>

                {/* Mobile Scrollable Tabs */}
                <div className="flex overflow-x-auto no-scrollbar px-2 md:px-4 gap-2 pb-3">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors border ${activeTab === tab.id
                                ? 'bg-primary/20 border-primary text-white'
                                : 'bg-[#1c2136] border-white/5 text-[#929bc9] hover:bg-white/5'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b0d17]/50">
                {filteredLogs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-[#555a7a] gap-4">
                        <span className="material-symbols-outlined text-6xl opacity-20">inbox</span>
                        <p>Brak raportów w tej kategorii.</p>
                    </div>
                )}

                {filteredLogs.map(log => (
                    <LogCard key={log.id} log={log} type={getLogType(log)} onDetail={() => setSelectedDetail(log)} />
                ))}
            </div>

            {/* Modal for Details (Battle Reports etc) */}
            {selectedDetail && (
                <DetailModal log={selectedDetail} onClose={() => setSelectedDetail(null)} />
            )}
        </div>
    );
};

const LogCard: React.FC<{ log: MissionLog, type: string, onDetail: () => void }> = ({ log, type, onDetail }) => {
    const isSuccess = log.outcome === 'success';
    const isDanger = log.outcome === 'danger';

    // Custom logic per type
    if (type === 'spy') {
        return (
            <div className="bg-[#1c2136] border border-white/10 rounded-lg overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="bg-[#111422] p-3 border-b border-white/5 flex justify-between items-center">
                    <span className="text-orange-400 font-bold text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        {log.title}
                    </span>
                    <span className="text-[10px] text-[#555a7a] font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="p-3">
                    <p className="text-sm text-[#cdd6f7] mb-2">{log.message}</p>
                    {/* Simplified Resource Preview if available in message parsing or extending log structure later */}
                    {/* Simplified Resource Preview if available in message parsing or extending log structure later */}
                    <button onClick={onDetail} className="w-full mt-2 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-xs font-bold rounded border border-orange-500/20 transition-colors flex items-center justify-center gap-1">
                        Pełny Raport
                    </button>
                </div>
            </div>
        );
    }

    if (type === 'attack') {
        return (
            <div className={`rounded-lg border overflow-hidden ${isSuccess ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                <div className="p-3 flex justify-between items-start">
                    <div>
                        <div className={`font-bold text-sm mb-1 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>{log.title}</div>
                        <div className="text-xs text-[#929bc9]">{new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                    {log.report && (
                        <div className="text-right">
                            <div className="text-[10px] uppercase text-[#555a7a] font-bold">Zrabowano</div>
                            <div className="text-xs text-white font-mono">
                                {Math.floor((log.report.loot.metal + log.report.loot.crystal + log.report.loot.deuterium) / 1000)}k
                            </div>
                        </div>
                    )}
                </div>
                {log.report && (
                    <button
                        onClick={onDetail}
                        className="w-full py-2 bg-black/20 hover:bg-black/40 text-xs text-white/70 hover:text-white border-t border-white/5 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">sticky_note_2</span>
                        Zobacz Szczegóły
                    </button>
                )}
            </div>
        );
    }

    // Default / Expedition
    return (
        <div className={`p-4 rounded-lg border ${isSuccess ? 'bg-green-500/5 border-green-500/20' :
            isDanger ? 'bg-red-500/5 border-red-500/20' :
                'bg-[#1c2136] border-white/5'
            }`}>
            <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-bold ${isSuccess ? 'text-green-400' :
                    isDanger ? 'text-red-400' :
                        'text-blue-300'
                    }`}>
                    {log.title}
                </span>
                <span className="text-[10px] text-[#555a7a]">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm text-[#929bc9] leading-relaxed">{log.message}</p>

            {/* Expedition Rewards */}
            {log.rewards && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {/* Render rewards logic similar to previous version but cleaner */}
                    {Object.entries(log.rewards).map(([key, val]) => {
                        if (!val || key === 'items' || key === 'ships') return null;
                        return (
                            <span key={key} className="text-[10px] bg-[#111422] border border-white/10 px-2 py-1 rounded text-white font-mono">
                                +{val} {key.charAt(0).toUpperCase()}
                            </span>
                        );
                    })}
                    {log.rewards.ships && Object.entries(log.rewards.ships).map(([id, count]) => (
                        <span key={id} className="text-[10px] bg-[#111422] border border-white/10 px-2 py-1 rounded text-white font-mono flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">rocket</span> {count} {SHIPS[id as ShipId]?.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// Detail Modal (extracted from Fleet.tsx and polished)
const DetailModal: React.FC<{ log: MissionLog, onClose: () => void }> = ({ log, onClose }) => {
    // If no report object, we might still want to show details (e.g. Spy Report parsed from message)
    // or just show the full message in a nice way.
    const report = log.report;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#1c2136] w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-[#1c2136] border-b border-white/10 p-4 flex justify-between items-center z-10">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500">
                            {log.title?.includes("Szpieg") ? 'visibility' : 'swords'}
                        </span>
                        {log.title}
                    </h3>
                    <button onClick={onClose} className="text-[#929bc9] hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {!report ? (
                        <div className="text-[#cdd6f7] text-sm whitespace-pre-wrap leading-relaxed bg-[#111422] p-4 rounded-lg border border-white/5">
                            {log.message}
                        </div>
                    ) : (
                        <>
                            {/* Loot */}
                            <div className="bg-[#111422] rounded-xl p-4 border border-white/5">
                                <div className="text-xs text-[#555a7a] uppercase font-bold mb-3 text-center">Zrabowane Surowce</div>
                                <div className="flex justify-around">
                                    <div className="text-center">
                                        <div className="text-blue-400 font-bold font-mono">{Math.floor(report.loot.metal)}</div>
                                        <div className="text-[10px] text-[#929bc9]">Metal</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-purple-400 font-bold font-mono">{Math.floor(report.loot.crystal)}</div>
                                        <div className="text-[10px] text-[#929bc9]">Kryształ</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-green-400 font-bold font-mono">{Math.floor(report.loot.deuterium)}</div>
                                        <div className="text-[10px] text-[#929bc9]">Deutery</div>
                                    </div>
                                </div>
                            </div>

                            {/* Losses Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="text-red-400 font-bold text-xs uppercase border-b border-red-500/20 pb-1">Agresor (Ty)</div>
                                    {Object.entries(report.attackerLosses).length === 0 ? <div className="text-green-500 text-xs">Brak strat</div> :
                                        Object.entries(report.attackerLosses).map(([id, n]) => (
                                            <div key={id} className="flex justify-between text-xs text-[#929bc9]">
                                                <span>{SHIPS[id as ShipId]?.name}</span>
                                                <span className="text-red-400">-{n}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                                <div className="space-y-2">
                                    <div className="text-blue-400 font-bold text-xs uppercase border-b border-blue-500/20 pb-1">Obrońca</div>
                                    {Object.entries(report.defenderLosses).length === 0 && Object.entries(report.defenderDefensesLost || {}).length === 0 ? <div className="text-green-500 text-xs">Brak strat</div> : (
                                        <>
                                            {Object.entries(report.defenderLosses).map(([id, n]) => (
                                                <div key={id} className="flex justify-between text-xs text-[#929bc9]">
                                                    <span>{SHIPS[id as ShipId]?.name}</span>
                                                    <span className="text-red-400">-{n}</span>
                                                </div>
                                            ))}
                                            {Object.entries(report.defenderDefensesLost || {}).map(([id, n]) => (
                                                <div key={id} className="flex justify-between text-xs text-[#929bc9]">
                                                    <span>{DEFENSES[id as DefenseId]?.name}</span>
                                                    <span className="text-red-400">-{n}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            );
};

            export default Logbook;
