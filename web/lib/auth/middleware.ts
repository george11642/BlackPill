import { supabaseAdmin } from '../supabase/client';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * User object attached to request after authentication
 */
export interface AuthenticatedUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Extended request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  userTier?: string;
  scansRemaining?: number;
}

/**
 * Verify JWT token from Supabase Auth
 * Returns the authenticated user or throws an error
 * 
 * Note: We no longer extract from x-vercel-sc-headers because that contains
 * Vercel's internal serverless JWT, NOT the user's Supabase token.
 * Instead, we use vercel.json headers to disable Suspense Cache for API routes.
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser> {
  const url = new URL(request.url);
  console.log('[Auth] Verifying token for:', request.method, url.pathname);

  // Get Authorization header directly - no fallback to x-vercel-sc-headers
  // (that contains Vercel's internal token, not the user's Supabase token)
  const authHeader = request.headers.get('authorization');

  console.log('[Auth] Authorization header present:', !!authHeader);
  console.log('[Auth] Authorization header starts with Bearer:', authHeader?.startsWith('Bearer '));

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[Auth] REJECTED: Missing or invalid authorization header');
    console.error('[Auth] Headers received:', Object.fromEntries(request.headers.entries()));
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  console.log('[Auth] Token length:', token.length);
  console.log('[Auth] Token preview:', token.substring(0, 20) + '...' + token.substring(token.length - 10));

  // Create a server-side Supabase client for token verification
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('[Auth] Supabase URL configured:', !!supabaseUrl);
  console.log('[Auth] Supabase Anon Key configured:', !!supabaseAnonKey);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Auth] REJECTED: Missing Supabase environment variables');
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Verify token with Supabase
  console.log('[Auth] Calling supabase.auth.getUser()...');
  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    console.error('[Auth] REJECTED: Supabase getUser error:', error.message);
    console.error('[Auth] Error details:', JSON.stringify(error));
    throw new Error('Invalid or expired token');
  }

  if (!data.user) {
    console.error('[Auth] REJECTED: No user returned from Supabase');
    throw new Error('Invalid or expired token');
  }

  console.log('[Auth] SUCCESS: User authenticated:', data.user.id, data.user.email);

  return {
    id: data.user.id,
    email: data.user.email,
    ...data.user,
  };
}

/**
 * Check if user has sufficient scans remaining
 * Returns user tier and scans remaining
 */
export async function checkScansRemaining(userId: string): Promise<{
  tier: string;
  scansRemaining: number;
}> {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('scans_remaining, tier')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error('User not found');
  }

  // Check if elite tier (unlimited scans)
  if (user.tier === 'elite') {
    return {
      tier: user.tier,
      scansRemaining: Infinity,
    };
  }

  // Check scans remaining
  if (user.scans_remaining <= 0) {
    throw new Error('Insufficient scans remaining');
  }

  return {
    tier: user.tier,
    scansRemaining: user.scans_remaining,
  };
}

/**
 * Helper to create authenticated API route handler
 * Wraps the handler with authentication check
 * Note: CORS is handled by the global middleware.ts
 */
export function withAuth<T = unknown>(
  handler: (request: Request, user: AuthenticatedUser) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    // Note: CORS preflight is handled by global middleware.ts
    // This wrapper only handles authentication
    const url = new URL(request.url);
    console.log('[withAuth] Processing request:', request.method, url.pathname);

    try {
      const user = await getAuthenticatedUser(request);
      console.log('[withAuth] Authentication successful, calling handler...');
      const response = await handler(request, user);
      console.log('[withAuth] Handler completed, returning response');
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      console.error('[withAuth] Authentication failed:', message);

      if (message.includes('Missing') || message.includes('Invalid') || message.includes('expired')) {
        console.error('[withAuth] Returning 401 Unauthorized');
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message,
          },
          { status: 401 }
        );
      } else {
        console.error('[withAuth] Returning 500 Internal Server Error:', error);
        return NextResponse.json(
          {
            error: 'Internal Server Error',
            message: 'Authentication failed',
          },
          { status: 500 }
        );
      }
    }
  };
}

