import React, { useState, useEffect } from 'react';
import { LogEntry, getLogs, clearLogs, subscribeLogs, copyLogsToClipboard, getErrorCount } from '../lib/errorLogger';

interface ErrorConsoleProps {
    visible: boolean;
    onClose: () => void;
}

const ErrorConsole: React.FC<ErrorConsoleProps> = ({ visible, onClose }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [minimized, setMinimized] = useState(false);

    useEffect(() => {
        setLogs(getLogs());
        const unsubscribe = subscribeLogs(setLogs);
        return unsubscribe;
    }, []);

    const filteredLogs = filter === 'all'
        ? logs
        : logs.filter(l => l.type === filter);

    const handleCopy = async () => {
        const success = await copyLogsToClipboard();
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClear = () => {
        clearLogs();
    };

    const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('pl-PL');

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: minimized ? '40px' : '50vh',
            maxHeight: minimized ? '40px' : '400px',
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
            borderTop: '2px solid #e94560',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'monospace',
            fontSize: '12px',
            transition: 'height 0.2s, max-height 0.2s'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.3)',
                borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer'
            }} onClick={() => setMinimized(!minimized)}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#e94560', fontWeight: 'bold' }}>🐛 Debug Console</span>
                    <span style={{ color: '#666', fontSize: '10px' }}>({logs.length} wpisów)</span>
                    {minimized && logs.filter(l => l.type === 'error').length > 0 && (
                        <span style={{ color: '#ff4444', fontSize: '10px' }}>
                            • {logs.filter(l => l.type === 'error').length} błędów
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!minimized && (
                        <>
                            {/* Filter buttons - hidden on mobile when not minimized */}
                            <div className="hidden sm:flex" style={{ gap: '8px' }}>
                                <button onClick={(e) => { e.stopPropagation(); setFilter('all'); }} style={{
                                    padding: '4px 8px',
                                    background: filter === 'all' ? '#e94560' : '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '10px'
                                }}>Wszystkie</button>
                                <button onClick={(e) => { e.stopPropagation(); setFilter('error'); }} style={{
                                    padding: '4px 8px',
                                    background: filter === 'error' ? '#ff4444' : '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '10px'
                                }}>🔴 Błędy</button>
                                <button onClick={(e) => { e.stopPropagation(); setFilter('warning'); }} style={{
                                    padding: '4px 8px',
                                    background: filter === 'warning' ? '#ffaa00' : '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '10px'
                                }}>🟡 Ostrzeżenia</button>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleCopy(); }} style={{
                                padding: '4px 12px',
                                background: copied ? '#4CAF50' : '#0f3460',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '10px'
                            }}>{copied ? '✓' : '📋'}</button>
                            <button onClick={(e) => { e.stopPropagation(); handleClear(); }} style={{
                                padding: '4px 12px',
                                background: '#333',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '10px'
                            }}>🗑️</button>
                        </>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }} style={{
                        padding: '4px 8px',
                        background: '#333',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}>{minimized ? '▲' : '▼'}</button>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
                        padding: '4px 12px',
                        background: '#e94560',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '10px'
                    }}>✕</button>
                </div>
            </div>

            {/* Log list - hidden when minimized */}
            {!minimized && (
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '8px'
                }}>
                    {filteredLogs.length === 0 ? (
                        <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                            Brak logów do wyświetlenia
                        </div>
                    ) : (
                        [...filteredLogs].reverse().map(log => (
                            <div
                                key={log.id}
                                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                                style={{
                                    padding: '8px',
                                    marginBottom: '4px',
                                    background: log.type === 'error' ? 'rgba(255,68,68,0.1)' :
                                        log.type === 'warning' ? 'rgba(255,170,0,0.1)' :
                                            'rgba(68,136,255,0.1)',
                                    borderLeft: `3px solid ${log.type === 'error' ? '#ff4444' :
                                        log.type === 'warning' ? '#ffaa00' : '#4488ff'}`,
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    <span style={{ color: '#666', minWidth: '60px', fontSize: '10px' }}>{formatTime(log.timestamp)}</span>
                                    <span style={{
                                        color: log.type === 'error' ? '#ff4444' :
                                            log.type === 'warning' ? '#ffaa00' : '#4488ff',
                                        fontWeight: 'bold',
                                        fontSize: '10px'
                                    }}>
                                        {log.type === 'error' ? '🔴' :
                                            log.type === 'warning' ? '🟡' : '🔵'}
                                    </span>
                                    <span style={{ color: '#eee', flex: 1, fontSize: '11px', wordBreak: 'break-word' }}>{log.message}</span>
                                </div>
                                {log.context && (
                                    <div style={{ color: '#888', marginTop: '4px', fontSize: '10px' }}>
                                        📍 {log.context}
                                    </div>
                                )}
                                {expanded === log.id && log.stack && (
                                    <pre style={{
                                        color: '#666',
                                        marginTop: '8px',
                                        fontSize: '9px',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-all',
                                        maxHeight: '150px',
                                        overflow: 'auto'
                                    }}>
                                        {log.stack}
                                    </pre>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// Floating debug button component
export const DebugButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const [errorCount, setErrorCount] = useState(0);

    useEffect(() => {
        const updateCount = () => setErrorCount(getErrorCount());
        updateCount();
        const unsubscribe = subscribeLogs(updateCount);
        return unsubscribe;
    }, []);

    return (
        <button
            onClick={onClick}
            style={{
                position: 'fixed',
                bottom: '80px', // Higher on mobile to avoid bottom nav
                right: '10px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: errorCount > 0 ? '#e94560' : 'rgba(15, 52, 96, 0.8)',
                border: '2px solid rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                zIndex: 9998,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                transition: 'all 0.2s'
            }}
            title="Otwórz konsolę debug"
        >
            🐛
            {errorCount > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: '#ff4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                }}>
                    {errorCount > 9 ? '9+' : errorCount}
                </span>
            )}
        </button>
    );
};

export default ErrorConsole;

