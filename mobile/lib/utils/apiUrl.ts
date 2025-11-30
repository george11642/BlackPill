/**
 * Get the API URL for making requests to the backend
 * Uses EXPO_PUBLIC_APP_URL environment variable (same as app URL)
 */
export const getApiUrl = (): string => {
  let appUrl = process.env.EXPO_PUBLIC_APP_URL;
  
  if (!appUrl) {
    console.warn('EXPO_PUBLIC_APP_URL not set, defaulting to https://www.black-pill.app');
    return 'https://www.black-pill.app';
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

