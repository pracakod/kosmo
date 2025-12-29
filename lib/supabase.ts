
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://roouxunjcwzrqwyusari.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvb3V4dW5qY3d6cnF3eXVzYXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTQxMzEsImV4cCI6MjA4MjU5MDEzMX0.wDnCr8Qhmwz-asqdY2gcC84KRqjpJIKxi5rlfL4H_Uo';

// Helper to check if we have valid configuration
export const isSupabaseConfigured = true;

// Create client with explicit headers to fix 406 error
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    }
});
