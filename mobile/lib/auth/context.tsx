import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { getApiUrl } from '../utils/apiUrl';

// Required for iOS OAuth to work properly
WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  onboardingLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshOnboardingStatus: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  hasCompletedOnboarding: false,
  onboardingLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
  refreshOnboardingStatus: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(true);

  // Fetch onboarding status when session changes
  const fetchOnboardingStatus = async (accessToken: string, retryCount = 0): Promise<boolean> => {
    try {
      setOnboardingLoading(true);
      // Add cache-busting query parameter to ensure fresh data
      const cacheBuster = `?t=${Date.now()}`;
      const apiUrl = getApiUrl();
      
      // Create abort controller with 10 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(
          `${apiUrl}/api/user/onboarding${cacheBuster}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const completed = data.onboarding_completed === true;
          setHasCompletedOnboarding(completed);
          console.log('[Auth] Onboarding status fetched:', {
            completed,
            rawValue: data.onboarding_completed,
            type: typeof data.onboarding_completed,
          });
          return true;
        } else {
          const errorText = await response.text();
          console.error('[Auth] Failed to fetch onboarding status:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          });
          // Only set to false if this is not a retry (to avoid overwriting valid state)
          if (retryCount === 0) {
            setHasCompletedOnboarding(false);
          }
          return false;
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Check if it's a timeout error
        if (fetchError.name === 'AbortError') {
          console.error('[Auth] Onboarding status fetch timed out after 10 seconds');
        } else {
          console.error('[Auth] Failed to fetch onboarding status:', fetchError);
        }
        
        // Only set to false if this is not a retry
        if (retryCount === 0) {
          setHasCompletedOnboarding(false);
        }
        return false;
      }
    } catch (error) {
      console.error('[Auth] Unexpected error in fetchOnboardingStatus:', error);
      // Ensure we default to incomplete if something goes wrong
      if (retryCount === 0) {
        setHasCompletedOnboarding(false);
      }
      return false;
    } finally {
      setOnboardingLoading(false);
    }
  };

  const refreshOnboardingStatus = async (): Promise<boolean> => {
    if (!session?.access_token) {
      console.warn('[Auth] Cannot refresh onboarding status: no access token');
      return false;
    }

    // Try fetching with retry logic
    let success = false;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      console.log(`[Auth] Refreshing onboarding status (attempt ${attempt + 1}/${maxRetries + 1})...`);
      success = await fetchOnboardingStatus(session.access_token, attempt);
      
      if (success) {
        // Verify the state was actually updated
        // We need to check after a brief delay to ensure state has propagated
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('[Auth] Onboarding status refresh successful');
        return true;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(500 * Math.pow(2, attempt), 2000);
        console.log(`[Auth] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.error('[Auth] Failed to refresh onboarding status after all retries - defaulting to false');
    // Ensure loading is cleared and user defaults to incomplete onboarding
    // This prevents the user from being stuck on splash screen
    setOnboardingLoading(false);
    setHasCompletedOnboarding(false);
    return false;
  };

  useEffect(() => {
    // Get initial session
    console.log('[Auth] Getting initial session...');
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        console.log('[Auth] getSession result:', {
          hasSession: !!session,
          userId: session?.user?.id,
          error: error?.message,
        });
        if (error) {
          console.error('[Auth] Error getting session:', error);
          supabase.auth.signOut().catch(() => {});
          setSession(null);
          setUser(null);
          setOnboardingLoading(false);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          // Fetch onboarding status if we have a session
          if (session?.access_token) {
            fetchOnboardingStatus(session.access_token);
          } else {
            setOnboardingLoading(false);
          }
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('[Auth] Error getting session:', error);
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
        setLoading(false);
        setOnboardingLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] onAuthStateChange:', event, {
        hasSession: !!session,
        userId: session?.user?.id,
      });
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.log('[Auth] Token refresh failed, signing out');
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
        setLoading(false);
        setHasCompletedOnboarding(false);
        setOnboardingLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] User signed out');
        setSession(null);
        setUser(null);
        setLoading(false);
        setHasCompletedOnboarding(false);
        setOnboardingLoading(false);
      } else {
        console.log('[Auth] Session updated');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        // Fetch onboarding status on session update
        if (session?.access_token) {
          fetchOnboardingStatus(session.access_token);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    // Get the redirect URL based on platform
    const redirectUrl = Platform.OS === 'web'
      ? `${process.env.EXPO_PUBLIC_APP_URL || window.location.origin}/auth/callback`
      : Linking.createURL('auth/callback');

    console.log('Google Sign-In redirect URL:', redirectUrl);

    if (Platform.OS === 'web') {
      // Web: Use standard OAuth flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
    } else {
      // Native (iOS/Android): Use expo-web-browser for OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // We'll handle the browser ourselves
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL returned');

      // Open the OAuth URL in a web browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
        {
          showInRecents: true,
          preferEphemeralSession: false,
        }
      );

      console.log('WebBrowser result:', result.type);

      if (result.type === 'success' && result.url) {
        // Extract the URL and handle the callback
        const url = new URL(result.url);
        const params = new URLSearchParams(url.hash.substring(1)); // Remove the # from hash
        
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken) {
          // Set the session with the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) throw sessionError;
        } else {
          // Try to get tokens from query params (some OAuth flows use this)
          const code = url.searchParams.get('code');
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) throw exchangeError;
          }
        }
      } else if (result.type === 'cancel') {
        throw new Error('Sign in was cancelled');
      }
    }
  };

  const signInWithApple = async () => {
    // Get the redirect URL based on platform
    const redirectUrl = Platform.OS === 'web'
      ? `${process.env.EXPO_PUBLIC_APP_URL || window.location.origin}/auth/callback`
      : Linking.createURL('auth/callback');

    console.log('Apple Sign-In redirect URL:', redirectUrl);

    if (Platform.OS === 'web') {
      // Web: Use Supabase OAuth flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
    } else {
      // Native (iOS/Android): Use expo-apple-authentication
      try {
        // Check if Apple authentication is available
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        if (!isAvailable) {
          throw new Error('Apple Sign In is not available on this device');
        }

        // Request Apple authentication
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        console.log('Apple authentication credential received:', {
          user: credential.user,
          email: credential.email,
          fullName: credential.fullName,
        });

        // Exchange the Apple identity token with Supabase
        if (!credential.identityToken) {
          throw new Error('No identity token received from Apple');
        }

        // Sign in with Supabase using the Apple identity token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
          nonce: credential.nonce || undefined,
        });

        if (error) throw error;

        // If this is the first time signing in, we might need to update the user metadata
        // with the name if it was provided
        if (credential.fullName && data.user) {
          const fullName = credential.fullName;
          const displayName = fullName.givenName && fullName.familyName
            ? `${fullName.givenName} ${fullName.familyName}`
            : fullName.givenName || fullName.familyName || undefined;

          if (displayName) {
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                full_name: displayName,
              },
            });
            if (updateError) {
              console.warn('[Auth] Failed to update user name:', updateError);
            }
          }
        }
      } catch (error: any) {
        // Handle user cancellation gracefully
        if (error.code === 'ERR_REQUEST_CANCELED') {
          throw new Error('Sign in was cancelled');
        }
        throw error;
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        hasCompletedOnboarding,
        onboardingLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signOut,
        refreshOnboardingStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

