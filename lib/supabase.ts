
import { createClient } from '@supabase/supabase-js';

// Safely retrieve environment variables.
// In some environments, import.meta.env might be undefined, causing a crash.
const meta = import.meta as any;
const env = meta.env || {};

// Use fallbacks to prevent createClient from throwing if env vars are missing
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder';

// Helper to check if we have valid (non-placeholder) configuration
export const isSupabaseConfigured = !supabaseUrl.includes('placeholder') && !supabaseAnonKey.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
