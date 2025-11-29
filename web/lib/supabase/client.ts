'use client';

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Create Supabase client for client-side use
 * This client respects Row Level Security (RLS) policies
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createSupabaseClient(url, anonKey);
}

// Lazy singleton for admin client
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Get Supabase client with service role key (for admin operations)
 * This client bypasses Row Level Security (RLS) policies
 * NOTE: This should only be used server-side, never expose service role key to client
 */
export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !serviceRoleKey) {
      throw new Error('Missing Supabase admin environment variables');
    }
    
    _supabaseAdmin = createSupabaseClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

// For backwards compatibility - lazy getter
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as any)[prop];
  },
});

// Lazy singleton for anon client  
let _supabase: SupabaseClient | null = null;

/**
 * Get Supabase client with anon key (for user operations)
 * This client respects Row Level Security (RLS) policies
 */
export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !anonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    _supabase = createSupabaseClient(url, anonKey);
  }
  return _supabase;
}

// For backwards compatibility - lazy getter
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  },
});

