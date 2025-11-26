import { supabase, supabaseAdmin } from '../supabase/client';
import { Request } from 'next/server';

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
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  // Verify token with Supabase
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error('Invalid or expired token');
  }

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

  // Check if unlimited tier
  if (user.tier === 'unlimited') {
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
 */
export function withAuth<T = unknown>(
  handler: (request: Request, user: AuthenticatedUser) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    try {
      const user = await getAuthenticatedUser(request);
      return handler(request, user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      
      if (message.includes('Missing') || message.includes('Invalid') || message.includes('expired')) {
        return Response.json(
          {
            error: 'Unauthorized',
            message,
          },
          { status: 401 }
        );
      }

      console.error('Auth middleware error:', error);
      return Response.json(
        {
          error: 'Internal Server Error',
          message: 'Authentication failed',
        },
        { status: 500 }
      );
    }
  };
}

