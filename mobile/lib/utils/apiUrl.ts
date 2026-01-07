/**
 * Get the API URL for making requests to the backend
 * Uses Supabase Edge Functions by default (EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL)
 * Falls back to Vercel (EXPO_PUBLIC_APP_URL) for legacy support
 */
export const getApiUrl = (): string => {
  // Prefer Supabase Edge Functions URL
  let apiUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;

  if (apiUrl) {
    // Remove trailing slash
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }
    console.log('[API] Using Supabase Edge Functions:', apiUrl);
    return apiUrl;
  }

  // Fallback to legacy Vercel URL
  let appUrl = process.env.EXPO_PUBLIC_APP_URL;

  if (!appUrl) {
    console.warn('No API URL configured, using default Supabase Functions URL');
    return 'https://wzsxpxwwgaqiaoxdyhnf.supabase.co/functions/v1';
  }

  // Remove trailing slash to avoid double slashes in URLs
  if (appUrl.endsWith('/')) {
    appUrl = appUrl.slice(0, -1);
  }

  // Normalize black-pill.app URLs to use www subdomain to avoid CORS redirect issues
  // Vercel redirects non-www to www, which breaks CORS preflight requests
  if (appUrl.includes('black-pill.app') && !appUrl.includes('www.black-pill.app')) {
    appUrl = appUrl.replace('black-pill.app', 'www.black-pill.app');
    console.log('[API] Normalized URL to use www:', appUrl);
  }

  return appUrl;
};

/**
 * Check if we're using Supabase Edge Functions
 */
export const isUsingSupabase = (): boolean => {
  return !!process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL ||
         getApiUrl().includes('supabase.co');
};

/**
 * Convert API endpoint path for consolidated Edge Functions
 *
 * Consolidated structure (6 functions):
 * - /ai?action={analyze|coach|recommend|insights|routines|transform}
 * - /webhooks?provider={stripe|revenuecat}
 * - /cron?job={daily-morning|daily-evening|check-renewals|...}
 * - /admin?action={grant-subscription|sync-subscription|user-delete|user-export}
 * - /timelapse?action={generate|get|list|music}
 * - /share?action={generate-card|log}
 *
 * Note: Many CRUD operations should use Supabase client directly (BaaS model)
 * This function handles the Edge Function routes only
 */
export const normalizeEndpoint = (endpoint: string): string => {
  if (!isUsingSupabase()) {
    return endpoint;
  }

  // Strip /api prefix
  let path = endpoint.startsWith('/api/') ? endpoint.replace('/api/', '/') : endpoint;

  // Map to consolidated functions
  // AI operations -> /ai?action=X
  if (path === '/analyze' || path.startsWith('/analyze/')) {
    return '/ai?action=analyze';
  }
  if (path.startsWith('/ai-coach/chat') || path === '/ai-coach/chat') {
    return '/ai?action=coach';
  }
  if (path.startsWith('/ai-coach/') || path === '/ai-coach') {
    // Other ai-coach operations (conversations list, delete, etc.)
    // These should use Supabase client directly
    return path;
  }
  if (path === '/products/recommend' || path.startsWith('/products/recommend')) {
    return '/ai?action=recommend';
  }
  if (path === '/insights/generate' || path.startsWith('/insights/generate')) {
    return '/ai?action=insights';
  }
  if (path === '/routines/generate' || path.startsWith('/routines/generate')) {
    return '/ai?action=routines';
  }
  if (path === '/ai/transform' || path.startsWith('/ai/transform')) {
    return '/ai?action=transform';
  }

  // Webhooks -> /webhooks?provider=X
  if (path.startsWith('/webhooks/stripe')) {
    return '/webhooks?provider=stripe';
  }
  if (path.startsWith('/webhooks/revenuecat')) {
    return '/webhooks?provider=revenuecat';
  }

  // Cron jobs -> /cron?job=X
  if (path.startsWith('/cron/')) {
    const job = path.replace('/cron/', '');
    return `/cron?job=${job}`;
  }

  // Admin operations -> /admin?action=X
  if (path.startsWith('/admin/grant-subscription')) {
    return '/admin?action=grant-subscription';
  }
  if (path === '/user/delete') {
    return '/admin?action=user-delete';
  }
  if (path === '/user/export') {
    return '/admin?action=user-export';
  }
  if (path === '/revenuecat/sync' || path.startsWith('/revenuecat/sync')) {
    return '/admin?action=sync-subscription';
  }

  // Timelapse operations -> /timelapse?action=X
  if (path === '/timelapse/generate' || path.startsWith('/timelapse/generate')) {
    return '/timelapse?action=generate';
  }
  if (path === '/timelapse/generate-video' || path.startsWith('/timelapse/generate-video')) {
    return '/timelapse?action=generate'; // Same as generate, video is handled internally
  }
  if (path.match(/^\/timelapse\/[^\/]+$/)) {
    // /timelapse/:id -> get specific timelapse
    const id = path.replace('/timelapse/', '');
    return `/timelapse?action=get&id=${id}`;
  }
  if (path === '/timelapse/music' || path.startsWith('/timelapse/music')) {
    return '/timelapse?action=music';
  }
  if (path === '/timelapse' || path === '/timelapses') {
    return '/timelapse?action=list';
  }

  // Share operations -> /share?action=X
  if (path === '/share/generate-card' || path.startsWith('/share/generate-card')) {
    // Parse query params from path if present
    const queryStart = path.indexOf('?');
    const queryString = queryStart > -1 ? path.substring(queryStart) : '';
    return `/share?action=generate-card${queryString ? '&' + queryString.substring(1) : ''}`;
  }
  if (path === '/share/log' || path.startsWith('/share/log')) {
    return '/share?action=log';
  }

  // Default: return path as-is (for direct Supabase REST API)
  return path;
};

