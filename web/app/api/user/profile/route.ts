import { NextRequest, NextResponse } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

/**
 * PUT /api/user/profile
 * Update user profile (username, bio, etc.)
 */
export const OPTIONS = () => {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
};

export const PUT = withAuth(async (request: NextRequest, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { username, bio, avatar_url, location } = body;

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Validate and add username if provided
    if (username !== undefined) {
      if (!username || typeof username !== 'string') {
        return NextResponse.json(
          { error: 'Username must be a non-empty string' },
          { status: 400, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }

      if (username.length < 3 || username.length > 30) {
        return NextResponse.json(
          { error: 'Username must be between 3 and 30 characters' },
          { status: 400, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }

      // Check for valid characters (alphanumeric, dots, underscores)
      if (!/^[a-zA-Z0-9._]+$/.test(username)) {
        return NextResponse.json(
          { error: 'Username can only contain letters, numbers, dots, and underscores' },
          { status: 400, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }

      // Check if username is already taken by another user
      const { data: existingUsers, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', username);

      if (checkError) {
        throw checkError;
      }

      // Check if any user other than the current user has this username
      if (existingUsers && existingUsers.length > 0) {
        const otherUserHasUsername = existingUsers.some((u: any) => u.id !== user.id);
        if (otherUserHasUsername) {
          return NextResponse.json(
            { error: 'Username is already taken' },
            { status: 409, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
          );
        }
      }

      updateData.username = username;
    }

    // Add optional fields if provided
    if (bio !== undefined) {
      if (bio && typeof bio !== 'string') {
        return NextResponse.json(
          { error: 'Bio must be a string' },
          { status: 400, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }
      updateData.bio = bio || null;
    }

    if (avatar_url !== undefined) {
      if (avatar_url && typeof avatar_url !== 'string') {
        return NextResponse.json(
          { error: 'Avatar URL must be a string' },
          { status: 400, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }
      updateData.avatar_url = avatar_url || null;
    }

    if (location !== undefined) {
      if (location && typeof location !== 'string') {
        return NextResponse.json(
          { error: 'Location must be a string' },
          { status: 400, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }
      updateData.location = location || null;
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select('id, username, bio, avatar_url, location, email, tier, created_at');

    if (updateError) {
      throw updateError;
    }

    if (!updatedUser || updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
      );
    }

    return createResponseWithId(
      {
        success: true,
        user: updatedUser[0],
        message: 'Profile updated successfully',
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return handleApiError(error, request);
  }
});

