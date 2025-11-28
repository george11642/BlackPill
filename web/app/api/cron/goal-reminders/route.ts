import { Request, NextResponse } from 'next/server';
import { supabaseServer as supabaseAdmin } from '@/lib/supabase/server';
import { sendNotificationToUser } from '@/lib/notifications/push';

/**
 * POST /api/cron/goal-reminders
 * Cron job endpoint to send goal reminder notifications
 * Called daily by Supabase pg_cron
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get active goals approaching deadline (3 days, 1 day, or overdue)
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    const oneDayFromNow = new Date(today);
    oneDayFromNow.setDate(today.getDate() + 1);

    // Find goals that need reminders
    const { data: goalsNeedingReminders, error: goalsError } = await supabaseAdmin
      .from('user_goals')
      .select('id, user_id, goal_type, target_value, current_value, deadline')
      .eq('status', 'active')
      .lte('deadline', threeDaysFromNow.toISOString().split('T')[0])
      .gte('deadline', today.toISOString().split('T')[0]); // Not overdue yet

    if (goalsError) {
      console.error('Error fetching goals for reminders:', goalsError);
      return NextResponse.json(
        { error: 'Failed to fetch goals' },
        { status: 500 }
      );
    }

    if (!goalsNeedingReminders || goalsNeedingReminders.length === 0) {
      return NextResponse.json({
        message: 'No goals need reminders',
        processed: 0,
      });
    }

    let processed = 0;
    const errors: string[] = [];

    for (const goal of goalsNeedingReminders) {
      try {
        const deadline = new Date(goal.deadline);
        const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Determine reminder message based on days left
        let title = 'Goal Reminder';
        let body = '';

        if (daysLeft === 3) {
          body = `Your goal deadline is in 3 days! Keep pushing to reach your target.`;
        } else if (daysLeft === 1) {
          body = `Your goal deadline is tomorrow! You're almost there!`;
        } else if (daysLeft === 0) {
          body = `Today is your goal deadline! Finish strong!`;
        } else {
          // Skip if not exactly 3, 1, or 0 days
          continue;
        }

        // Get user's push tokens
        const { data: tokens, error: tokensError } = await supabaseAdmin
          .from('user_device_tokens')
          .select('token')
          .eq('user_id', goal.user_id);

        if (tokensError || !tokens || tokens.length === 0) {
          continue; // User has no push tokens
        }

        // Send notification to all user's devices
        for (const tokenData of tokens) {
          try {
            await sendNotificationToUser(
              goal.user_id,
              {
                title,
                body,
                data: {
                  type: 'goal_reminder',
                  goal_id: goal.id,
                  days_left: daysLeft,
                },
              },
              tokenData.token
            );
          } catch (tokenError) {
            console.error(`Failed to send notification to token ${tokenData.token}:`, tokenError);
            errors.push(`Token ${tokenData.token}: ${tokenError}`);
          }
        }

        processed++;
      } catch (goalError) {
        console.error(`Error processing goal ${goal.id}:`, goalError);
        errors.push(`Goal ${goal.id}: ${goalError}`);
      }
    }

    return NextResponse.json({
      message: 'Goal reminders processed',
      processed,
      total: goalsNeedingReminders.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Goal reminders cron error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

