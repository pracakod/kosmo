
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// These are public keys, safe to include in client-side code
const supabaseUrl = 'https://roouxunjcwzrqwyusari.supabase.co';
const supabaseAnonKey = 'sb_publishable__KBx196RhAAcP2CpvKtTxQ_lgUEabF2';

// Helper to check if we have valid configuration
export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
