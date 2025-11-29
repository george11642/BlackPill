import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleApiError, getRequestId, createResponseWithId } from '@/lib';
import { createAdminClient } from '@/lib/supabase/admin';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

/**
 * DELETE /api/user/delete
 * Delete user account and all associated data
 */
export const OPTIONS = () => {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
};

export const DELETE = withAuth(async (request: NextRequest, user) => {
  const requestId = getRequestId(request);

  try {
    // Create admin client for server-side operations
    const adminClient = createAdminClient();
    
    // Delete the user from Supabase Auth (this will cascade to related data via database triggers/RLS)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError);
      throw deleteError;
    }

    // Note: Related data (analyses, user records, etc.) should be cleaned up
    // by database triggers or will be orphaned. If you need explicit cleanup,
    // add it here before deleting the auth user.

    return createResponseWithId(
      {
        success: true,
        message: 'Account deleted successfully',
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Delete account error:', error);
    return handleApiError(error, request);
  }
});

