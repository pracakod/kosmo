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
            height: '50vh',
            maxHeight: '400px',
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
            borderTop: '2px solid #e94560',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'monospace',
            fontSize: '12px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.3)',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#e94560', fontWeight: 'bold' }}>🐛 Debug Console</span>
                    <span style={{ color: '#666', fontSize: '10px' }}>({logs.length} wpisów)</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Filter buttons */}
                    <button onClick={() => setFilter('all')} style={{
                        padding: '4px 8px',
                        background: filter === 'all' ? '#e94560' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '10px'
                    }}>Wszystkie</button>
                    <button onClick={() => setFilter('error')} style={{
                        padding: '4px 8px',
                        background: filter === 'error' ? '#ff4444' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '10px'
                    }}>🔴 Błędy</button>
                    <button onClick={() => setFilter('warning')} style={{
                        padding: '4px 8px',
                        background: filter === 'warning' ? '#ffaa00' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '10px'
                    }}>🟡 Ostrzeżenia</button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleCopy} style={{
                        padding: '4px 12px',
                        background: copied ? '#4CAF50' : '#0f3460',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '10px'
                    }}>{copied ? '✓ Skopiowano!' : '📋 Kopiuj'}</button>
                    <button onClick={handleClear} style={{
                        padding: '4px 12px',
                        background: '#333',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '10px'
                    }}>🗑️ Wyczyść</button>
                    <button onClick={onClose} style={{
                        padding: '4px 12px',
                        background: '#e94560',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '10px'
                    }}>✕ Zamknij</button>
                </div>
            </div>

            {/* Log list */}
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
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#666', minWidth: '70px' }}>{formatTime(log.timestamp)}</span>
                                <span style={{
                                    color: log.type === 'error' ? '#ff4444' :
                                        log.type === 'warning' ? '#ffaa00' : '#4488ff',
                                    fontWeight: 'bold',
                                    minWidth: '80px'
                                }}>
                                    {log.type === 'error' ? '🔴 ERROR' :
                                        log.type === 'warning' ? '🟡 WARN' : '🔵 INFO'}
                                </span>
                                <span style={{ color: '#eee', flex: 1 }}>{log.message}</span>
                            </div>
                            {log.context && (
                                <div style={{ color: '#888', marginTop: '4px', paddingLeft: '158px', fontSize: '11px' }}>
                                    📍 {log.context}
                                </div>
                            )}
                            {expanded === log.id && log.stack && (
                                <pre style={{
                                    color: '#666',
                                    marginTop: '8px',
                                    paddingLeft: '158px',
                                    fontSize: '10px',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all'
                                }}>
                                    {log.stack}
                                </pre>
                            )}
                        </div>
                    ))
                )}
            </div>
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
                bottom: '20px',
                right: '20px',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: errorCount > 0 ? '#e94560' : '#0f3460',
                border: '2px solid rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                zIndex: 9998,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
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
                    width: '20px',
                    height: '20px',
                    fontSize: '10px',
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
