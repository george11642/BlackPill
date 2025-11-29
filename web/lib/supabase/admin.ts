import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Create Supabase admin client with service role key
 * This client bypasses Row Level Security (RLS) policies
 * Only use in server-side API routes
 */
export function createAdminClient() {
  return createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

