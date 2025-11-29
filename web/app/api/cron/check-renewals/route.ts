import { Request } from 'next/server';
import { supabaseAdmin, handleApiError, getRequestId, createResponseWithId, sendRenewalReminder } from '@/lib';

/**
 * Cron job to check for upcoming subscription renewals
 * Should run daily to send 7-day renewal reminders
 *
 * Scheduled via Supabase pg_cron (runs daily at 00:00 UTC)
 * The job is configured in migration 022_setup_supabase_cron_jobs.sql
 */
export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    // Verify this is from Supabase cron (via pg_net) - required
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return createResponseWithId(
        {
          error: 'Unauthorized',
        },
        { status: 401 },
        requestId
      );
    }

    // Get subscriptions renewing in 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const eightDaysFromNow = new Date();
    eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);

    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select(
        `
        *,
        users!inner(email)
      `
      )
      .eq('status', 'active')
      .gte('current_period_end', sevenDaysFromNow.toISOString())
      .lt('current_period_end', eightDaysFromNow.toISOString());

    if (error) {
      throw error;
    }

    let emailsSent = 0;

    // Send renewal reminders
    for (const sub of subscriptions || []) {
      try {
        // Check if we already sent reminder for this period
        const reminderKey = `renewal_reminder_${sub.id}_${sub.current_period_end}`;

        // Use a simple check - in production, use a separate table or Redis
        const { data: existing } = await supabaseAdmin
          .from('support_tickets')
          .select('id')
          .eq('subject', reminderKey)
          .maybeSingle();

        if (existing) {
          console.log(`Reminder already sent for subscription ${sub.id}`);
          continue;
        }

        // Calculate amount (would need to fetch from Stripe)
        const tierPrices: Record<string, number> = {
          pro: 12.99,
          elite: 19.99,
        };

        await sendRenewalReminder((sub.users as any).email, {
          tier: sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1),
          amount: tierPrices[sub.tier] || 12.99,
          renewal_date: new Date(sub.current_period_end).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        });

        // Mark as sent (using support_tickets as a simple log)
        await supabaseAdmin.from('support_tickets').insert({
          user_id: sub.user_id,
          subject: reminderKey,
          message: 'Renewal reminder sent',
          status: 'closed',
        });

        emailsSent++;
      } catch (emailError) {
        console.error(`Failed to send renewal reminder for ${sub.id}:`, emailError);
      }
    }

    return createResponseWithId(
      {
        success: true,
        subscriptions_checked: subscriptions?.length || 0,
        emails_sent: emailsSent,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Check renewals cron error:', error);
    return handleApiError(error, request);
  }
}

