import React from 'react';

interface ChangelogModalProps {
    onClose: () => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#1c2136] w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#15192b]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                            <span className="material-symbols-outlined text-2xl">info</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-wide">Aktualności i Zmiany</h2>
                            <p className="text-xs text-[#929bc9]">Ostatnie aktualizacje (Od wczoraj)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#929bc9] hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#0b0d17]/50 space-y-6">

                    {/* Section: System Walki */}
                    <div className="space-y-3">
                        <h3 className="text-red-400 font-bold uppercase text-sm border-b border-red-500/20 pb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">swords</span>
                            Nowy System Walki
                        </h3>
                        <div className="text-sm text-[#cdd6f7] space-y-2">
                            <p>Wprowadzono system kontr (Kamień-Papier-Nożyce) dla statków!</p>
                            <ul className="list-disc list-inside text-[#929bc9] pl-2 space-y-1">
                                <li>Każdy statek posiada teraz bonusy przeciwko konkretnym typom jednostek (np. Myśliwiec Lekki jest skuteczny przeciwko Krążownikom).</li>
                                <li>Informacje o bonusach ("Silny przeciwko") są widoczne w Stoczni oraz Sklepie.</li>
                                <li>Walki są teraz symulowane w rundach (max 6), co daje bardziej realistyczne wyniki starć.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#111422]/50 p-4 rounded-lg border border-white/5">
                            <h3 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">shopping_cart</span>
                                Sklep Premium Nowości
                            </h3>
                            <ul className="list-disc list-inside text-sm text-[#929bc9] space-y-1">
                                <li><strong>Nowe Pakiety:</strong> Dostępne nowe pakiety surowców i ulepszeń.</li>
                                <li><strong>Gwiazda Śmierci:</strong> Teraz dostępna również w ofercie specjalnej.</li>
                            </ul>
                        </div>

                        <div className="bg-[#111422]/50 p-4 rounded-lg border border-white/5">
                            <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">new_releases</span>
                                System Poziomów i Ranking
                            </h3>
                            <ul className="list-disc list-inside text-sm text-[#929bc9] space-y-1">
                                <li><strong>System Poziomów:</strong> Zbieraj XP za budowę i flotę, aby awansować!</li>
                                <li><strong>Korona Lidera:</strong> Gracz #1 w rankingu otrzymuje złotą koronę przy nicku.</li>
                                <li>Ranking jest teraz bardziej dynamiczny i przejrzysty.</li>
                            </ul>
                        </div>

                        <div className="bg-[#111422]/50 p-4 rounded-lg border border-white/5">
                            <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">shield</span>
                                System Obrony i Kontry
                            </h3>
                            <ul className="list-disc list-inside text-sm text-[#929bc9] space-y-1">
                                <li>Dodano informację <strong>"Silny Przeciwko"</strong> w widoku Obrony i Stoczni.</li>
                                <li>Teraz łatwo sprawdzisz, co najlepiej kontruje daną jednostkę.</li>
                            </ul>
                        </div>

                        <div className="bg-[#111422]/50 p-4 rounded-lg border border-white/5">
                            <h3 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">pest_control</span>
                                Inne Zmiany
                            </h3>
                            <ul className="list-disc list-inside text-sm text-[#929bc9] space-y-1">
                                <li><strong>Tryb Pełnoekranowy:</strong> Dostępny w menu bocznym (dla lepszej immersji).</li>
                                <li>Usunięto przycisk debugowania (robaczka) na rzecz tego okna Info.</li>
                                <li>Optymalizacja wydajności gry.</li>
                            </ul>
                        </div>
                    </div>

                </div>

                <div className="p-4 border-t border-white/10 bg-[#15192b] text-center text-xs text-[#555a7a]">
                    Kosmo v2.1.0 - Build {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
};

export default ChangelogModal;
