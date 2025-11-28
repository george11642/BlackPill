import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/goals
 * Get user's goals
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('user_goals')
      .select('*, goal_milestones(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: goals, error } = await query;

    if (error) {
      throw error;
    }

    // Enhance goals with calculated fields
    const enhancedGoals = (goals || []).map((goal: any) => {
      const currentValue = goal.current_value || 0;
      const targetValue = goal.target_value;
      const progressPercentage = targetValue > 0 
        ? Math.min(100, Math.max(0, (currentValue / targetValue) * 100))
        : 0;

      const deadline = new Date(goal.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      deadline.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate expected progress based on time elapsed
      const createdDate = new Date(goal.created_at);
      const totalDays = Math.ceil((deadline.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.max(0, Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
      const expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
      const isOnTrack = progressPercentage >= expectedProgress - 10; // Allow 10% tolerance

      // Find next milestone
      const milestones = goal.goal_milestones || [];
      const nextMilestone = milestones
        .filter((m: any) => !m.completed)
        .sort((a: any, b: any) => {
          const dateA = new Date(a.target_date).getTime();
          const dateB = new Date(b.target_date).getTime();
          return dateA - dateB;
        })[0];

      return {
        ...goal,
        progress_percentage: Math.round(progressPercentage * 10) / 10, // Round to 1 decimal
        days_remaining: daysRemaining,
        is_on_track: isOnTrack,
        next_milestone: nextMilestone ? {
          id: nextMilestone.id,
          name: nextMilestone.milestone_name,
          target_value: nextMilestone.target_value,
          target_date: nextMilestone.target_date,
          days_until: Math.ceil((new Date(nextMilestone.target_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        } : null,
      };
    });

    return createResponseWithId(
      {
        goals: enhancedGoals,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get goals error:', error);
    return handleApiError(error, request);
  }
});

