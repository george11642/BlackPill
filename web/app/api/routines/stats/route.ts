import { Request } from 'next/server';
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * GET /api/routines/stats
 * Get routine completion statistics
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const routine_id = searchParams.get('routine_id');

    // If no routine_id provided, return overall stats for the user
    if (!routine_id) {
      // Get overall routine stats for user
      const { data: completions, error: completionError } = await supabaseAdmin
        .from('routine_completions')
        .select('completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (completionError) throw completionError;

      // Get total analyses
      const { data: analyses, error: analysisError } = await supabaseAdmin
        .from('analyses')
        .select('score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (analysisError) throw analysisError;

      // Calculate stats
      const totalAnalyses = analyses?.length || 0;
      const completedTasks = completions?.length || 0;
      const averageScore = analyses && analyses.length > 0
        ? analyses.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / analyses.length
        : 0;
      
      // Calculate best score
      const bestScore = analyses && analyses.length > 0
        ? Math.max(...analyses.map((a: any) => a.score || 0))
        : 0;

      // Helper function to get ISO week string (week starts on Monday)
      function getISOWeek(date: Date): string {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
      }

      // Calculate streaks
      let currentStreak = 0;
      let weeklyStreak = 0;
      let monthlyStreak = 0;
      
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
        const weeksWithCompletions = new Set<string>();
        completions.forEach((c: any) => {
          const date = new Date(c.completed_at);
          const weekStr = getISOWeek(date);
          weeksWithCompletions.add(weekStr);
        });

        const sortedWeeks = Array.from(weeksWithCompletions).sort().reverse();
        
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

      // Calculate weekly scores for chart
      const weeklyScores: number[] = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayAnalyses = analyses?.filter((a: any) => {
          const analysisDate = new Date(a.created_at).toISOString().split('T')[0];
          return analysisDate === dateStr;
        }) || [];
        
        if (dayAnalyses.length > 0) {
          const avgDayScore = dayAnalyses.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / dayAnalyses.length;
          weeklyScores.push(Number(avgDayScore.toFixed(1)));
        } else {
          // Use the most recent score before this day, or 0
          weeklyScores.push(weeklyScores.length > 0 ? weeklyScores[weeklyScores.length - 1] : 0);
        }
      }

      // Calculate improvement (difference between latest and oldest in last 30 days)
      let improvement = 0;
      if (analyses && analyses.length >= 2) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentAnalyses = analyses.filter((a: any) => new Date(a.created_at) >= thirtyDaysAgo);
        if (recentAnalyses.length >= 2) {
          const latestScore = recentAnalyses[0].score || 0;
          const oldestScore = recentAnalyses[recentAnalyses.length - 1].score || 0;
          improvement = latestScore - oldestScore;
        }
      }

      const stats = {
        totalAnalyses,
        completedTasks,
        averageScore: Number(averageScore.toFixed(1)),
        currentStreak,
        weeklyStreak,
        monthlyStreak,
        bestScore: Number(bestScore.toFixed(1)),
        improvement: Number(improvement.toFixed(1)),
        weeklyScores,
      };

      return createResponseWithId(
        { stats },
        { status: 200 },
        requestId
      );
    }

    // Verify routine belongs to user
    const { data: routine, error: routineError } = await supabaseAdmin
      .from('routines')
      .select('id')
      .eq('id', routine_id)
      .eq('user_id', user.id)
      .single();

    if (routineError || !routine) {
      return createResponseWithId(
        {
          error: 'Unauthorized',
        },
        { status: 403 },
        requestId
      );
    }

    // Get streak info
    const { data: streak, error: streakError } = await supabaseAdmin
      .from('routine_streaks')
      .select('*')
      .eq('routine_id', routine_id)
      .eq('user_id', user.id)
      .single();

    // Get total tasks
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('routine_tasks')
      .select('id')
      .eq('routine_id', routine_id);

    // Get completions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: completions, error: completionsError } = await supabaseAdmin
      .from('routine_completions')
      .select('completed_at, skipped')
      .eq('routine_id', routine_id)
      .eq('user_id', user.id)
      .gte('completed_at', thirtyDaysAgo.toISOString());

    if (streakError || tasksError || completionsError) {
      throw new Error('Failed to fetch stats');
    }

    // Calculate statistics
    const totalTasks = tasks?.length || 0;
    const totalCompletions = completions?.filter((c: any) => !c.skipped).length || 0;
    const skippedCount = completions?.filter((c: any) => c.skipped).length || 0;

    // Group by date
    const completionByDate: Record<string, { completed: number; skipped: number }> = {};
    completions?.forEach((c: any) => {
      const date = new Date(c.completed_at).toISOString().split('T')[0];
      if (!completionByDate[date]) {
        completionByDate[date] = { completed: 0, skipped: 0 };
      }
      if (c.skipped) {
        completionByDate[date].skipped++;
      } else {
        completionByDate[date].completed++;
      }
    });

    const completionRate =
      totalTasks > 0 ? parseFloat(((totalCompletions / (totalTasks * 30)) * 100).toFixed(1)) : 0;

    return createResponseWithId(
      {
        streak: streak || {
          current_streak: 0,
          longest_streak: 0,
          weekly_streak: 0,
          monthly_streak: 0,
          longest_weekly_streak: 0,
          longest_monthly_streak: 0,
        },
        stats: {
          total_tasks: totalTasks,
          total_completions: totalCompletions,
          skipped_count: skippedCount,
          completion_rate: completionRate,
          completion_by_date: completionByDate,
        },
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Stats error:', error);
    return handleApiError(error, request);
  }
});

