'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Create Supabase client for client-side use
 * This client respects Row Level Security (RLS) policies
 */
export function createClient() {
  return createSupabaseClient(
    config.supabase.url,
    config.supabase.anonKey
  );
}

/**
 * Create Supabase client with service role key (for admin operations)
 * This client bypasses Row Level Security (RLS) policies
 * NOTE: This should only be used server-side, never expose service role key to client
 */
export const supabaseAdmin = createSupabaseClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Create Supabase client with anon key (for user operations)
 * This client respects Row Level Security (RLS) policies
 */
export const supabase = createSupabaseClient(
  config.supabase.url,
  config.supabase.anonKey
);

