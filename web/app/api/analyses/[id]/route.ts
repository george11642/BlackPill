import { NextResponse } from 'next/server';
import { withAuth, supabaseAdmin, getRequestId } from '@/lib';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

/**
 * Calculate potential score based on breakdown scores
 * This estimates the user's potential if they improve their weakest areas
 */
function calculatePotentialScore(
  currentScore: number,
  breakdown: {
    symmetry?: number;
    jawline?: number;
    eyes?: number;
    lips?: number;
    skin?: number;
    bone_structure?: number;
    hair?: number;
  }
): number {
  if (!breakdown) {
    // If no breakdown, estimate potential as current + 1.5 (capped at 10)
    return Math.min(10, currentScore + 1.5);
  }

  const scores = [
    breakdown.symmetry || currentScore,
    breakdown.jawline || currentScore,
    breakdown.eyes || currentScore,
    breakdown.lips || currentScore,
    breakdown.skin || currentScore,
    breakdown.bone_structure || currentScore,
    breakdown.hair || currentScore,
  ];

  // Find the weakest areas (lowest scores)
  const sortedScores = [...scores].sort((a, b) => a - b);
  const weakestScores = sortedScores.slice(0, 3); // Bottom 3 scores
  
  // Calculate improvement potential
  // Assume user can improve their weak areas by 1.5-2 points with effort
  // More improvable areas: skin, lips (grooming), jawline (exercise/posture)
  // Less improvable: symmetry, bone_structure, eyes
  
  const improvementFactors: { [key: string]: number } = {
    skin: 2.0,        // Very improvable with skincare
    hair: 2.0,        // Very improvable with styling, products, grooming
    lips: 1.5,        // Moderately improvable with grooming/hydration
    jawline: 1.5,     // Improvable with exercise, mewing, weight loss
    eyes: 0.8,        // Less improvable (mainly grooming around eyes)
    symmetry: 0.5,    // Minimally improvable
    bone_structure: 0.5, // Minimally improvable without surgery
  };

  // Calculate potential improvement
  let potentialImprovement = 0;
  const categoryKeys = ['symmetry', 'jawline', 'eyes', 'lips', 'skin', 'bone_structure', 'hair'];
  
  categoryKeys.forEach((key, index) => {
    const score = scores[index];
    const factor = improvementFactors[key] || 1.0;
    const maxPossible = 10;
    const gap = maxPossible - score;
    
    // Potential improvement is a fraction of the gap, weighted by improvability
    potentialImprovement += (gap * factor * 0.15); // 15% of gap * factor
  });

  // Calculate potential score
  const potentialScore = Math.min(10, currentScore + potentialImprovement);
  
  // Round to 1 decimal place
  return Math.round(potentialScore * 10) / 10;
}

/**
 * Calculate percentile based on score (approximate normal distribution)
 */
function calculatePercentile(score: number): number {
  // Assuming scores follow a normal distribution with mean ~6 and std ~1.5
  const mean = 6.0;
  const std = 1.5;
  const z = (score - mean) / std;
  
  // Approximate CDF using error function approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  const percentile = z > 0 ? (1 - p) * 100 : p * 100;
  return Math.round(percentile);
}

/**
 * OPTIONS /api/analyses/[id] - Handle CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/analyses/[id] - Get single analysis with potential score
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req: Request, user) => {
    const requestId = getRequestId(req);
    const { id } = await params;

    try {
      const { data: analysis, error } = await supabaseAdmin
        .from('analyses')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error || !analysis) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }

      // Check if user owns this analysis OR it's public
      if (analysis.user_id !== user.id && !analysis.is_public) {
        return NextResponse.json(
          { error: 'Not authorized to view this analysis' },
          { status: 403, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }

      // Calculate potential score and percentile
      const potentialScore = calculatePotentialScore(analysis.score, analysis.breakdown);
      const percentile = calculatePercentile(analysis.score);

      // Get user's referral code
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      // Generate fresh signed URL (existing URLs may have expired tokens)
      let imageUrl = analysis.image_url;
      if (imageUrl) {
        try {
          let filePath: string | null = null;

          // Extract file path from signed URL
          if (imageUrl.includes('/storage/v1/object/sign/analyses/')) {
            const match = imageUrl.match(/\/storage\/v1\/object\/sign\/analyses\/([^?]+)/);
            if (match) {
              filePath = match[1];
            }
          }
          // Extract file path from public URL
          else if (imageUrl.includes('/storage/v1/object/public/analyses/')) {
            const match = imageUrl.match(/\/storage\/v1\/object\/public\/analyses\/([^?]+)/);
            if (match) {
              filePath = match[1];
            }
          }
          // If it's just a path
          else if (!imageUrl.startsWith('http')) {
            filePath = imageUrl;
          }

          if (filePath) {
            const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
              .from('analyses')
              .createSignedUrl(filePath, 3600);

            if (!signedUrlError && signedUrlData) {
              imageUrl = signedUrlData.signedUrl;
            }
          }
        } catch (urlError) {
          console.error('Error generating signed URL for analysis:', id, urlError);
        }
      }

      // Return enhanced analysis with potential score
      const enhancedAnalysis = {
        ...analysis,
        image_url: imageUrl,
        potential_score: potentialScore,
        percentile,
        potential_gain: Math.round((potentialScore - analysis.score) * 10) / 10,
        referral_code: userData?.referral_code || null,
      };

      return NextResponse.json(enhancedAnalysis, { 
        status: 200, 
        headers: { ...corsHeaders, 'X-Request-ID': requestId } 
      });
    } catch (error) {
      console.error('Get analysis error:', error);
      return NextResponse.json(
        { error: 'Failed to get analysis' },
        { status: 500, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
      );
    }
  })(request);
}

/**
 * DELETE /api/analyses/[id] - Delete analysis
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req: Request, user) => {
    const requestId = getRequestId(req);
    const { id } = await params;

    try {
      // Soft delete
      const { error } = await supabaseAdmin
        .from('analyses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return NextResponse.json(
        { success: true },
        { status: 200, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
      );
    } catch (error) {
      console.error('Delete analysis error:', error);
      return NextResponse.json(
        { error: 'Failed to delete analysis' },
        { status: 500, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
      );
    }
  })(request);
}
