import { createClient } from '@supabase/supabase-js';

// Feature flag - controls whether to use Supabase for publishing
// Set to false to keep existing IndexedDB-only behavior
export const ENABLE_SUPABASE_PUBLISH = false;

// Supabase client initialization
// Requires environment variables:
// - NEXT_PUBLIC_SUPABASE_URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Safe guard: only create client if credentials are available
export const supabase = 
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

// Helper to get Supabase client (returns null if not configured)
export function getSupabaseClient() {
  return supabase;
}
