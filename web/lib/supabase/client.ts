import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Create Supabase client with service role key (for admin operations)
 * This client bypasses Row Level Security (RLS) policies
 */
export const supabaseAdmin = createClient(
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
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

