/**
 * Error Logger Utility
 * Captures errors and warnings, stores them locally and optionally in Supabase.
 */

import { supabase } from './supabase';

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
let userId: string | null = null;

// Set user ID for logging (call after login)
export const setLoggerUserId = (id: string | null) => {
    userId = id;
};

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

// Send error to Supabase (for admin viewing)
const sendErrorToSupabase = async (entry: LogEntry) => {
    try {
        await supabase.from('error_logs').insert({
            user_id: userId,
            error_type: entry.type,
            message: entry.message,
            context: entry.context,
            stack: entry.stack,
            user_agent: navigator.userAgent,
            url: window.location.href
        });
    } catch (e) {
        // Silently fail - don't create infinite loop
        console.warn('Failed to send error to Supabase:', e);
    }
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
    const entry = addLog('error', message, context, error?.stack);
    // Send to Supabase for admin
    sendErrorToSupabase(entry);
    return entry;
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
        logError(message, 'UnhandledPromiseRejection', event.reason instanceof Error ? event.reason : undefined);
    };

    // Capture resource loading errors (img, script, link)
    window.addEventListener('error', (event: ErrorEvent) => {
        // Resource errors don't bubble, but capture works.
        // They differ from runtime errors as event.target will be an element.
        if (event.target && (event.target instanceof HTMLElement)) {
            const element = event.target as HTMLElement;
            const src = (element as any).src || (element as any).href || 'unknown';
            const tagName = element.tagName.toLowerCase();
            logError(`Failed to load resource: <${tagName} src="${src}">`, 'ResourceLoader');
        }
    }, true); // true = capture phase
};

// Load existing logs
loadLogs();

console.log('🐛 Error Logger initialized');

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

