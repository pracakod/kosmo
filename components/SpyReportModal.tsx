import React from 'react';
import { SHIPS, DEFENSES } from '../constants';

interface SpyReportModalProps {
    report: any; // Spy Report Structure
    onClose: () => void;
}

const SpyReportModal: React.FC<SpyReportModalProps> = ({ report, onClose }) => {
    const attackerLevel = report.attackerSpyLevel || 0;
    const defenderLevel = report.defenderSpyLevel || 0;
    const levelDiff = attackerLevel - defenderLevel;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#1c2136] w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-blue-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                            <span className="material-symbols-outlined text-2xl">visibility</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Raport Szpiegowski</h2>
                            <p className="text-sm text-[#929bc9]">
                                Cel: <span className="text-white font-bold">{report.targetName}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#929bc9] hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tech Comparison Bar */}
                <div className="bg-[#15192b] px-6 py-3 border-b border-white/5 flex justify-between items-center text-sm">
                    <div className="flex flex-col">
                        <span className="text-[#555a7a] text-xs font-bold uppercase">Twoja Technologia</span>
                        <span className="text-blue-400 font-mono font-bold text-lg">Poziom {attackerLevel}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[#555a7a] text-xs font-bold uppercase">Technologia Celu</span>
                        <span className="text-red-400 font-mono font-bold text-lg">Poziom {defenderLevel}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#0b0d17]/50 space-y-6">

                    {/* Resources */}
                    {report.resources && (
                        <div>
                            <h3 className="text-[#929bc9] font-bold uppercase text-xs mb-3 border-b border-white/5 pb-1">Zasoby</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-[#111422] rounded p-3 text-center border border-white/5">
                                    <div className="text-xs text-[#555a7a] font-bold mb-1">Tytan</div>
                                    <div className="font-mono text-blue-400">{Math.floor(report.resources.metal).toLocaleString()}</div>
                                </div>
                                <div className="bg-[#111422] rounded p-3 text-center border border-white/5">
                                    <div className="text-xs text-[#555a7a] font-bold mb-1">Krzem</div>
                                    <div className="font-mono text-purple-400">{Math.floor(report.resources.crystal).toLocaleString()}</div>
                                </div>
                                <div className="bg-[#111422] rounded p-3 text-center border border-white/5">
                                    <div className="text-xs text-[#555a7a] font-bold mb-1">Plazma</div>
                                    <div className="font-mono text-green-400">{Math.floor(report.resources.deuterium).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fleet */}
                    <div>
                        <h3 className="text-[#929bc9] font-bold uppercase text-xs mb-3 border-b border-white/5 pb-1 flex justify-between">
                            Flota
                            {!report.ships && <span className="text-red-500 text-[10px]">Wymagana różnica poziomów: +2</span>}
                        </h3>
                        {report.ships ? (
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(report.ships).map(([id, count]) => (
                                    <div key={id} className="flex justify-between p-2 bg-[#111422] rounded border border-white/5 text-sm">
                                        <span className="text-white">{SHIPS[id as any]?.name || id}</span>
                                        <span className="font-mono text-[#929bc9]">{count as number}</span>
                                    </div>
                                ))}
                                {Object.keys(report.ships).length === 0 && <span className="text-white/30 italic text-sm">Brak stacjonującej floty.</span>}
                            </div>
                        ) : (
                            <div className="p-4 bg-red-900/10 border border-red-500/20 rounded text-center text-red-400 text-sm">
                                🔒 Dane niedostępne. Zbadaj wyższy poziom Technologii Szpiegowskiej.
                            </div>
                        )}
                    </div>

                    {/* Defense */}
                    <div>
                        <h3 className="text-[#929bc9] font-bold uppercase text-xs mb-3 border-b border-white/5 pb-1 flex justify-between">
                            Obrona
                            {!report.defenses && <span className="text-red-500 text-[10px]">Wymagana różnica poziomów: +3</span>}
                        </h3>
                        {report.defenses ? (
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(report.defenses).map(([id, count]) => (
                                    <div key={id} className="flex justify-between p-2 bg-[#111422] rounded border border-white/5 text-sm">
                                        <span className="text-white">{DEFENSES[id as any]?.name || id}</span>
                                        <span className="font-mono text-[#929bc9]">{count as number}</span>
                                    </div>
                                ))}
                                {Object.keys(report.defenses).length === 0 && <span className="text-white/30 italic text-sm">Brak systemów obronnych.</span>}
                            </div>
                        ) : (
                            <div className="p-4 bg-red-900/10 border border-red-500/20 rounded text-center text-red-400 text-sm">
                                🔒 Dane niedostępne.
                            </div>
                        )}
                    </div>

                    {/* Buildings */}
                    <div>
                        <h3 className="text-[#929bc9] font-bold uppercase text-xs mb-3 border-b border-white/5 pb-1 flex justify-between">
                            Budynki
                            {!report.buildings && <span className="text-red-500 text-[10px]">Wymagana różnica poziomów: +5</span>}
                        </h3>
                        {report.buildings ? (
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(report.buildings).map(([id, level]) => (
                                    <div key={id} className="flex justify-between p-2 bg-[#111422] rounded border border-white/5 text-sm">
                                        <span className="text-white capitalize">{id.replace(/_/g, ' ')}</span>
                                        <span className="font-mono text-[#929bc9]">Poz. {level as number}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-red-900/10 border border-red-500/20 rounded text-center text-red-400 text-sm">
                                🔒 Dane niedostępne.
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SpyReportModal;
