/**
 * Get the API URL for making requests to the backend
 * Uses EXPO_PUBLIC_APP_URL environment variable (same as app URL)
 */
export const getApiUrl = (): string => {
  let appUrl = process.env.EXPO_PUBLIC_APP_URL;
  
  if (!appUrl) {
    console.warn('EXPO_PUBLIC_APP_URL not set, defaulting to http://localhost:3000');
    return 'http://localhost:3000';
  }
  
  // Remove trailing slash to avoid double slashes in URLs
  if (appUrl.endsWith('/')) {
    appUrl = appUrl.slice(0, -1);
  }
  
  return appUrl;
};

