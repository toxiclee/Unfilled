import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Feature flag - controls whether to use Supabase for publishing
// Set to false to keep existing IndexedDB-only behavior
export const ENABLE_SUPABASE_PUBLISH = false;

// Supabase client initialization
// Requires environment variables:
// - NEXT_PUBLIC_SUPABASE_URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY

// Use a function to access environment variables for client-side compatibility
function getSupabaseConfig() {
  if (typeof window !== 'undefined') {
    // Client-side: use window or direct access
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
  }
  // Server-side
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
}

let supabaseInstance: SupabaseClient | null = null;

function initSupabase() {
  if (supabaseInstance) return supabaseInstance;
  
  const { url, key } = getSupabaseConfig();
  if (url && key) {
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  const instance = initSupabase();
  return instance !== null;
}

// Helper to get Supabase client (throws if not configured)
export function getSupabaseClient(): SupabaseClient {
  const instance = initSupabase();
  if (!instance) {
    throw new Error(
      'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }
  return instance;
}

