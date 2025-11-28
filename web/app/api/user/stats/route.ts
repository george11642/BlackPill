import { NextRequest } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/user/stats
 * Get user's dashboard stats (overall score, potential, streak)
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  const requestId = getRequestId(request);

  try {
    // Get user's latest analysis for current score
    const { data: latestAnalysis, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .select('id, score, breakdown, created_at, image_url')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysisError) throw analysisError;

    // Get user profile including tier and scans_remaining from users table
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('avatar_url, username, email, tier, scans_remaining')
      .eq('id', user.id)
      .single();

    // Also check subscriptions table for active subscription (for users who subscribed via Stripe)
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    // Helper function to get ISO week string (week starts on Monday)
    function getISOWeek(date: Date): string {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
    }

    // Calculate streaks from routine completions
    let currentStreak = 0;
    let weeklyStreak = 0;
    let monthlyStreak = 0;
    
    const { data: completions } = await supabaseAdmin
      .from('routine_completions')
      .select('completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (completions && completions.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate daily streak
      const uniqueDates = new Set<string>();
      completions.forEach((c: any) => {
        const date = new Date(c.completed_at).toISOString().split('T')[0];
        uniqueDates.add(date);
      });
      
      const sortedDates = Array.from(uniqueDates).sort().reverse();
      
      for (let i = 0; i < sortedDates.length; i++) {
        const completionDate = new Date(sortedDates[i]);
        completionDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);
        
        if (completionDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate weekly streak
      // Get ISO week number for each completion (week starts on Monday)
      const weeksWithCompletions = new Set<string>();
      completions.forEach((c: any) => {
        const date = new Date(c.completed_at);
        const weekStr = getISOWeek(date);
        weeksWithCompletions.add(weekStr);
      });

      const sortedWeeks = Array.from(weeksWithCompletions).sort().reverse();
      const currentWeek = getISOWeek(today);
      
      for (let i = 0; i < sortedWeeks.length; i++) {
        const weekDate = new Date(today);
        weekDate.setDate(today.getDate() - i * 7);
        const expectedWeek = getISOWeek(weekDate);
        if (sortedWeeks[i] === expectedWeek) {
          weeklyStreak++;
        } else {
          break;
        }
      }

      // Calculate monthly streak
      const monthsWithCompletions = new Set<string>();
      completions.forEach((c: any) => {
        const date = new Date(c.completed_at);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthsWithCompletions.add(yearMonth);
      });

      const sortedMonths = Array.from(monthsWithCompletions).sort().reverse();
      
      for (let i = 0; i < sortedMonths.length; i++) {
        const expectedDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const expectedMonth = `${expectedDate.getFullYear()}-${(expectedDate.getMonth() + 1).toString().padStart(2, '0')}`;
        if (sortedMonths[i] === expectedMonth) {
          monthlyStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate overall score and potential (potential is calculated as score + 1.5, capped at 10)
    const overallScore = latestAnalysis?.score || 0;
    const potentialScore = overallScore > 0 ? Math.min(10, Number(overallScore) + 1.5) : 0;

    // Get total analyses count
    const { count: totalAnalyses } = await supabaseAdmin
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null);

    // Determine tier: prefer subscription tier if active, otherwise use users table tier
    const effectiveTier = subscription?.tier || profile?.tier || 'free';
    // Get scans remaining from users table (this is the source of truth)
    const scansRemaining = profile?.scans_remaining ?? 1;

    // Generate fresh signed URL for the latest analysis image (existing URLs may have expired)
    let latestAnalysisImageUrl: string | null = null;
    if (latestAnalysis?.image_url) {
      try {
        let filePath: string | null = null;

        // Extract file path from signed URL (format: /storage/v1/object/sign/analyses/user-id/file.jpg?token=...)
        if (latestAnalysis.image_url.includes('/storage/v1/object/sign/analyses/')) {
          const match = latestAnalysis.image_url.match(/\/storage\/v1\/object\/sign\/analyses\/([^?]+)/);
          if (match) {
            filePath = match[1];
          }
        }
        // Extract file path from public URL (format: /storage/v1/object/public/analyses/...)
        else if (latestAnalysis.image_url.includes('/storage/v1/object/public/analyses/')) {
          const match = latestAnalysis.image_url.match(/\/storage\/v1\/object\/public\/analyses\/([^?]+)/);
          if (match) {
            filePath = match[1];
          }
        }
        // If it's just a path (not a URL)
        else if (!latestAnalysis.image_url.startsWith('http')) {
          filePath = latestAnalysis.image_url;
        }

        if (filePath) {
          // Generate fresh signed URL (valid for 1 hour)
          const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
            .from('analyses')
            .createSignedUrl(filePath, 3600);

          if (!signedUrlError && signedUrlData) {
            latestAnalysisImageUrl = signedUrlData.signedUrl;
          }
        }
      } catch (urlError) {
        console.error('Error generating signed URL for latest analysis image:', urlError);
      }
    }

    return createResponseWithId(
      {
        overall_score: Number(overallScore.toFixed(1)),
        potential_score: Number(potentialScore.toFixed(1)),
        streak: currentStreak,
        weekly_streak: weeklyStreak,
        monthly_streak: monthlyStreak,
        tier: effectiveTier,
        scans_remaining: scansRemaining,
        total_analyses: totalAnalyses || 0,
        breakdown: latestAnalysis?.breakdown || null,
        last_analysis_date: latestAnalysis?.created_at || null,
        avatar_url: profile?.avatar_url || null,
        username: profile?.username || profile?.email?.split('@')[0] || 'User',
        email: profile?.email || user.email,
        latest_analysis_id: latestAnalysis?.id || null,
        latest_analysis_image: latestAnalysisImageUrl,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('User stats error:', error);
    return handleApiError(error, request);
  }
});

