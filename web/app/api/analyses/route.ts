import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/analyses
 * Get user's analysis history
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const orderBy = searchParams.get('order_by') || 'created_at';

    // Get analyses
    const { data: analyses, error, count } = await supabaseAdmin
      .from('analyses')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order(orderBy, { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Generate fresh signed URLs for private bucket (existing URLs may have expired tokens)
    const analysesWithUrls = await Promise.all(
      (analyses || []).map(async (analysis) => {
        if (analysis.image_url) {
          try {
            let filePath: string | null = null;

            // Extract file path from signed URL (format: /storage/v1/object/sign/analyses/user-id/file.jpg?token=...)
            if (analysis.image_url.includes('/storage/v1/object/sign/analyses/')) {
              const match = analysis.image_url.match(/\/storage\/v1\/object\/sign\/analyses\/([^?]+)/);
              if (match) {
                filePath = match[1];
              }
            }
            // Extract file path from public URL (format: /storage/v1/object/public/analyses/...)
            else if (analysis.image_url.includes('/storage/v1/object/public/analyses/')) {
              const match = analysis.image_url.match(/\/storage\/v1\/object\/public\/analyses\/([^?]+)/);
              if (match) {
                filePath = match[1];
              }
            }
            // If it's just a path (not a URL)
            else if (!analysis.image_url.startsWith('http')) {
              filePath = analysis.image_url;
            }

            if (filePath) {
              // Generate fresh signed URL (valid for 1 hour)
              const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
                .from('analyses')
                .createSignedUrl(filePath, 3600);

              if (!signedUrlError && signedUrlData) {
                return {
                  ...analysis,
                  image_url: signedUrlData.signedUrl,
                };
              }
            }
          } catch (urlError) {
            console.error('Error generating signed URL for analysis:', analysis.id, urlError);
          }
        }
        return analysis;
      })
    );

    return createResponseWithId(
      {
        analyses: analysesWithUrls || [],
        total: count || 0,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get analyses error:', error);
    return handleApiError(error, request);
  }
});

