import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * POST /api/ethical/acknowledge-disclaimers
 * Save user's acknowledgment of disclaimers
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { disclaimers_acknowledged } = body;

    if (disclaimers_acknowledged !== true) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'disclaimers_acknowledged must be true',
        },
        { status: 400 },
        requestId
      );
    }

    // Upsert ethical settings
    const { data: settings, error } = await supabaseAdmin
      .from('user_ethical_settings')
      .upsert(
        {
          user_id: user.id,
          disclaimers_acknowledged: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Acknowledge disclaimers error:', error);
      throw error;
    }

    return createResponseWithId(
      {
        settings,
        message: 'Disclaimers acknowledged successfully',
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Acknowledge disclaimers error:', error);
    return handleApiError(error, request);
  }
});

