import { Request } from 'next/server';
import { withAuth, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);
  
  return createResponseWithId(
    { user },
    { status: 200 },
    requestId
  );
});

