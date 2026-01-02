import React, { useState } from 'react';
import { BattleReport, ShipId, DefenseId } from '../types';
import { SHIPS, DEFENSES } from '../constants';

interface BattleReportModalProps {
    report: BattleReport;
    onClose: () => void;
}

const BattleReportModal: React.FC<BattleReportModalProps> = ({ report, onClose }) => {
    const [activeTab, setActiveTab] = useState<'summary' | 'fleets' | 'log'>('summary');

    const isAttackerWin = report.result === 'attacker_win';

    // Calculate totals for summary
    const totalAttackerLoot = (report.loot.metal || 0) + (report.loot.crystal || 0) + (report.loot.deuterium || 0);

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#1c2136] w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className={`p-4 border-b border-white/10 flex justify-between items-center ${isAttackerWin ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isAttackerWin ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            <span className="material-symbols-outlined text-2xl">
                                {isAttackerWin ? 'emoji_events' : 'sentiment_very_dissatisfied'}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                                {isAttackerWin ? 'Zwycięstwo Agresora' : 'Zwycięstwo Obrońcy'}
                            </h2>
                            <p className="text-xs text-[#929bc9]">Raport Bojowy</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#929bc9] hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-[#15192b]">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 ${activeTab === 'summary' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-[#929bc9] hover:bg-white/5'}`}
                    >
                        Podsumowanie
                    </button>
                    <button
                        onClick={() => setActiveTab('fleets')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 ${activeTab === 'fleets' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-[#929bc9] hover:bg-white/5'}`}
                    >
                        Floty i Straty
                    </button>
                    <button
                        onClick={() => setActiveTab('log')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 ${activeTab === 'log' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-[#929bc9] hover:bg-white/5'}`}
                    >
                        Przebieg Walki
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#0b0d17]/50">

                    {/* SUMMARY TAB */}
                    {activeTab === 'summary' && (
                        <div className="space-y-6">
                            {/* Loot */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-[#111422] rounded-xl p-4 border border-white/5 flex flex-col items-center">
                                    <span className="text-xs uppercase text-[#555a7a] font-bold mb-2">Zrabowany Metal</span>
                                    <span className="text-2xl font-mono text-blue-400">{Math.floor(report.loot.metal).toLocaleString()}</span>
                                </div>
                                <div className="bg-[#111422] rounded-xl p-4 border border-white/5 flex flex-col items-center">
                                    <span className="text-xs uppercase text-[#555a7a] font-bold mb-2">Zrabowany Kryształ</span>
                                    <span className="text-2xl font-mono text-purple-400">{Math.floor(report.loot.crystal).toLocaleString()}</span>
                                </div>
                                <div className="bg-[#111422] rounded-xl p-4 border border-white/5 flex flex-col items-center">
                                    <span className="text-xs uppercase text-[#555a7a] font-bold mb-2">Zrabowany Deuter</span>
                                    <span className="text-2xl font-mono text-green-400">{Math.floor(report.loot.deuterium).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Tech Bonuses */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <h4 className="text-red-400 font-bold uppercase text-sm border-b border-red-500/20 pb-2">Technologia Agresora</h4>
                                    <div className="flex justify-between text-sm text-[#929bc9]">
                                        <span>Broń:</span>
                                        <span className="text-white font-mono">+{Math.round((report.bonuses.attacker.weapon - 1) * 100)}%</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-[#929bc9]">
                                        <span>Osłony:</span>
                                        <span className="text-white font-mono">+{Math.round((report.bonuses.attacker.shield - 1) * 100)}%</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-[#929bc9]">
                                        <span>Pancerz:</span>
                                        <span className="text-white font-mono">+{Math.round((report.bonuses.attacker.armour - 1) * 100)}%</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-blue-400 font-bold uppercase text-sm border-b border-blue-500/20 pb-2">Technologia Obrońcy</h4>
                                    <div className="flex justify-between text-sm text-[#929bc9]">
                                        <span>Broń:</span>
                                        <span className="text-white font-mono">+{Math.round((report.bonuses.defender.weapon - 1) * 100)}%</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-[#929bc9]">
                                        <span>Osłony:</span>
                                        <span className="text-white font-mono">+{Math.round((report.bonuses.defender.shield - 1) * 100)}%</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-[#929bc9]">
                                        <span>Pancerz:</span>
                                        <span className="text-white font-mono">+{Math.round((report.bonuses.defender.armour - 1) * 100)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FLEETS TAB */}
                    {activeTab === 'fleets' && (
                        <div className="space-y-8">
                            {/* Attacker */}
                            <div>
                                <h3 className="text-red-400 font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined">rocket_launch</span>
                                    Flota Agresora
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-[#111422] text-[#555a7a] uppercase font-bold text-xs">
                                            <tr>
                                                <th className="p-3 rounded-tl-lg">Jednostka</th>
                                                <th className="p-3 text-right">Start</th>
                                                <th className="p-3 text-right text-red-400">Straty</th>
                                                <th className="p-3 text-right rounded-tr-lg">Koniec</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {Object.keys(report.initialAttackerShips).map(id => {
                                                const start = report.initialAttackerShips[id] || 0;
                                                const end = report.finalAttackerShips[id] || 0;
                                                const lost = report.attackerLosses[id] || 0;
                                                if (start === 0) return null;
                                                return (
                                                    <tr key={id} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-3 font-medium text-white">{SHIPS[id as ShipId]?.name || id}</td>
                                                        <td className="p-3 text-right font-mono text-[#929bc9]">{start}</td>
                                                        <td className="p-3 text-right font-mono text-red-400">{lost > 0 ? `-${lost}` : '-'}</td>
                                                        <td className="p-3 text-right font-mono text-white">{end}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Defender */}
                            <div>
                                <h3 className="text-blue-400 font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined">shield</span>
                                    Flota i Obrona Obrońcy
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-[#111422] text-[#555a7a] uppercase font-bold text-xs">
                                            <tr>
                                                <th className="p-3 rounded-tl-lg">Jednostka</th>
                                                <th className="p-3 text-right">Start</th>
                                                <th className="p-3 text-right text-red-400">Straty</th>
                                                <th className="p-3 text-right rounded-tr-lg">Koniec</th>
                                                {/* Maybe separate column for repaired? */}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {/* Ships */}
                                            {Object.keys(report.initialDefenderShips).map(id => {
                                                const start = report.initialDefenderShips[id] || 0;
                                                const end = report.finalDefenderShips[id] || 0;
                                                const lost = report.defenderLosses[id] || 0;
                                                if (start === 0) return null;
                                                return (
                                                    <tr key={`ship-${id}`} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-3 font-medium text-white">{SHIPS[id as ShipId]?.name || id}</td>
                                                        <td className="p-3 text-right font-mono text-[#929bc9]">{start}</td>
                                                        <td className="p-3 text-right font-mono text-red-400">{lost > 0 ? `-${lost}` : '-'}</td>
                                                        <td className="p-3 text-right font-mono text-white">{end}</td>
                                                    </tr>
                                                );
                                            })}
                                            {/* Defenses */}
                                            {Object.keys(report.initialDefenderDefenses).map(id => {
                                                const start = report.initialDefenderDefenses[id] || 0;
                                                const end = report.finalDefenderDefenses[id] || 0;
                                                const lost = report.defenderDefensesLost[id] || 0; // Does this account for repair?
                                                // Note on repair: The 'end' value in report includes repaired units.
                                                // 'lost' value in report is the *permanent* loss usually?
                                                // Let's assume report data is correct: final = initial - permanent_loss. 
                                                // Or if lost means destroyed, and some are rebuilt?
                                                // In combatUtils: final = initial - lost + repaired. lost = destroyed.
                                                // Let's just show start/lost/end.

                                                if (start === 0 && end === 0) return null;
                                                return (
                                                    <tr key={`def-${id}`} className="hover:bg-white/5 transition-colors bg-blue-900/5">
                                                        <td className="p-3 font-medium text-blue-200">{DEFENSES[id as DefenseId]?.name || id}</td>
                                                        <td className="p-3 text-right font-mono text-[#929bc9]">{start}</td>
                                                        <td className="p-3 text-right font-mono text-red-400">{lost > 0 ? `-${lost}` : '-'}</td>
                                                        <td className="p-3 text-right font-mono text-white">{end}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LOG TAB */}
                    {activeTab === 'log' && (
                        <div className="space-y-2 font-mono text-sm">
                            {report.logMessages.map((msg, idx) => (
                                <div key={idx} className="p-3 bg-[#111422] rounded border border-white/5 text-[#cdd6f7]">
                                    {msg}
                                </div>
                            ))}
                            {report.logMessages.length === 0 && (
                                <div className="text-center text-[#555a7a] py-8 italic">Brak szczegółowego logu walki.</div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default BattleReportModal;
