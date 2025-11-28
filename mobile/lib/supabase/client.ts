import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Debug logging for environment variables
console.log('[Supabase] Platform:', Platform.OS);
console.log('[Supabase] URL configured:', !!supabaseUrl);
console.log('[Supabase] Anon key configured:', !!supabaseAnonKey);

// Use Platform.OS for reliable platform detection
const isWeb = Platform.OS === 'web';
console.log('[Supabase] isWeb:', isWeb);

let storageAdapter: any;

if (isWeb) {
  // Use localStorage for web
  storageAdapter = {
    getItem: (key: string) => {
      try {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
        return null;
      } catch (e) {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } catch (e) {
        console.error('Failed to set item in localStorage', e);
      }
    },
    removeItem: (key: string) => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch (e) {
        console.error('Failed to remove item from localStorage', e);
      }
    },
  };
} else {
  // Use expo-secure-store for mobile (iOS/Android)
  console.log('[Supabase] Using SecureStore for session storage');
  storageAdapter = {
    getItem: async (key: string) => {
      try {
        const value = await SecureStore.getItemAsync(key);
        console.log('[SecureStore] getItem:', key, value ? 'found' : 'not found');
        return value;
      } catch (e) {
        console.error('[SecureStore] Failed to get item:', key, e);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        console.log('[SecureStore] setItem:', key, 'length:', value?.length);
        await SecureStore.setItemAsync(key, value);
      } catch (e) {
        console.error('[SecureStore] Failed to set item:', key, e);
      }
    },
    removeItem: async (key: string) => {
      try {
        console.log('[SecureStore] removeItem:', key);
        await SecureStore.deleteItemAsync(key);
      } catch (e) {
        console.error('[SecureStore] Failed to remove item:', key, e);
      }
    },
  };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

