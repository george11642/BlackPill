import { Request, Response } from 'next/server';

/**
 * Add CORS headers to response
 * Allows requests from localhost (for development) and the production domain
 */
export function addCorsHeaders(response: Response, request: Request): Response {
  const origin = request.headers.get('origin') || '';
  
  // Allow localhost for development, and production domain
  const allowedOrigins = ['http://localhost:8081', 'http://localhost:3000', 'https://black-pill.app'];
  
  // Check if origin is allowed
  let isOriginAllowed = false;
  for (const allowed of allowedOrigins) {
    if (origin === allowed || origin.endsWith(allowed)) {
      isOriginAllowed = true;
      break;
    }
  }
  
  if (isOriginAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    // No origin header, allow all (for non-browser requests)
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Request-ID, X-Requested-With'
  );
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return response;
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    const response = new Response(null, { status: 204 });
    return addCorsHeaders(response, request);
  }
  return null;
}

/**
 * Wrapper for authenticated API routes with CORS support
 * Handles OPTIONS preflight BEFORE auth check
 */
export function withCorsAndAuth<T = unknown>(
  handler: (request: Request, user: any) => Promise<Response>,
  authFn: (request: Request) => Promise<any>
) {
  return async (request: Request): Promise<Response> => {
    // Handle CORS preflight FIRST (before auth check)
    const corsResponse = handleCorsPreFlight(request);
    if (corsResponse) {
      return corsResponse;
    }

    try {
      // Get authenticated user
      const user = await authFn(request);
      // Handle actual request
      const response = await handler(request, user);
      return addCorsHeaders(response, request);
    } catch (error) {
      // Return error response with CORS headers
      const response = Response.json(
        { error: 'Unauthorized', message: error instanceof Error ? error.message : 'Authentication failed' },
        { status: 401 }
      );
      return addCorsHeaders(response, request);
    }
  };
}

/**
 * Wrapper for public API routes with CORS support
 */
export function withCors<T = unknown>(
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    // Handle preflight
    const corsResponse = handleCorsPreFlight(request);
    if (corsResponse) {
      return corsResponse;
    }

    // Handle actual request
    const response = await handler(request);
    return addCorsHeaders(response, request);
  };
}

