const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Create Supabase client with service role key (for admin operations)
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Create Supabase client with anon key (for user operations)
const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

module.exports = {
  supabaseAdmin,
  supabase,
};

