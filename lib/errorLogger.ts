/**
 * Error Logger Utility
 * Captures errors and warnings, stores them locally and optionally in Supabase.
 */

export interface LogEntry {
    id: string;
    timestamp: number;
    type: 'error' | 'warning' | 'info';
    message: string;
    context?: string;
    stack?: string;
}

const MAX_LOGS = 100;
const STORAGE_KEY = 'kosmo_error_logs';

// In-memory logs for current session
let logs: LogEntry[] = [];
let listeners: ((logs: LogEntry[]) => void)[] = [];

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Load logs from localStorage
export const loadLogs = (): LogEntry[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            logs = JSON.parse(stored);
        }
    } catch (e) {
        logs = [];
    }
    return logs;
};

// Save logs to localStorage
const saveLogs = () => {
    try {
        // Keep only last MAX_LOGS entries
        if (logs.length > MAX_LOGS) {
            logs = logs.slice(-MAX_LOGS);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
        // Storage full or unavailable
    }
};

// Notify listeners
const notifyListeners = () => {
    listeners.forEach(fn => fn([...logs]));
};

// Add a log entry
export const addLog = (type: LogEntry['type'], message: string, context?: string, stack?: string) => {
    const entry: LogEntry = {
        id: generateId(),
        timestamp: Date.now(),
        type,
        message,
        context,
        stack
    };
    logs.push(entry);
    saveLogs();
    notifyListeners();
    return entry;
};

// Log error
export const logError = (message: string, context?: string, error?: Error) => {
    console.error(`🔴 [ERROR] ${message}`, context, error);
    return addLog('error', message, context, error?.stack);
};

// Log warning
export const logWarning = (message: string, context?: string) => {
    console.warn(`🟡 [WARNING] ${message}`, context);
    return addLog('warning', message, context);
};

// Log info
export const logInfo = (message: string, context?: string) => {
    console.log(`🔵 [INFO] ${message}`, context);
    return addLog('info', message, context);
};

// Clear all logs
export const clearLogs = () => {
    logs = [];
    saveLogs();
    notifyListeners();
};

// Get all logs
export const getLogs = (): LogEntry[] => [...logs];

// Get unread count (errors only)
export const getErrorCount = (): number => logs.filter(l => l.type === 'error').length;

// Subscribe to log updates
export const subscribeLogs = (callback: (logs: LogEntry[]) => void) => {
    listeners.push(callback);
    return () => {
        listeners = listeners.filter(fn => fn !== callback);
    };
};

// Initialize global error handlers
export const initGlobalErrorHandlers = () => {
    // Capture unhandled errors
    window.onerror = (message, source, lineno, colno, error) => {
        logError(String(message), `${source}:${lineno}:${colno}`, error);
        return false; // Don't suppress default behavior
    };

    // Capture unhandled promise rejections
    window.onunhandledrejection = (event) => {
        const message = event.reason?.message || String(event.reason);
        logError(`Unhandled Promise: ${message}`, 'Promise', event.reason);
    };

    // Load existing logs
    loadLogs();

    console.log('🐛 Error Logger initialized');
};

// Copy logs to clipboard (for sharing)
export const copyLogsToClipboard = async (): Promise<boolean> => {
    try {
        const text = logs.map(l =>
            `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.type.toUpperCase()}: ${l.message}${l.context ? ` (${l.context})` : ''}`
        ).join('\n');
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        return false;
    }
};
