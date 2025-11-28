/**
 * Supabase server-side admin client
 * Uses service role key for admin operations in Next.js API routes
 * This is only for server-side use and should never be exposed to the client
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wzsxpxwwgaqiaoxdyhnf.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create admin client with service role key
// This bypasses RLS (Row Level Security) for administrative operations
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Log warning if service role key is not set (only in development)
if (process.env.NODE_ENV === 'development' && !supabaseServiceRoleKey) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. Some admin operations may fail.');
}

