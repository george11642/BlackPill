const { supabaseAdmin } = require('../../utils/supabase');
const { sendRenewalReminder } = require('../../utils/email-service');

/**
 * Cron job to check for upcoming subscription renewals
 * Should run daily to send 7-day renewal reminders
 * 
 * Configure in Vercel:
 * vercel.json: {
 *   "crons": [{
 *     "path": "/api/cron/check-renewals",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
module.exports = async (req, res) => {
  try {
    // Verify this is from Vercel cron
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get subscriptions renewing in 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const eightDaysFromNow = new Date();
    eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);

    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        users!inner(email)
      `)
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
        const tierPrices = {
          basic: 4.99,
          pro: 9.99,
          unlimited: 19.99,
        };

        await sendRenewalReminder(sub.users.email, {
          tier: sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1),
          amount: tierPrices[sub.tier] || 9.99,
          renewal_date: new Date(sub.current_period_end).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        });

        // Mark as sent (using support_tickets as a simple log)
        await supabaseAdmin
          .from('support_tickets')
          .insert({
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

    res.status(200).json({
      success: true,
      subscriptions_checked: subscriptions?.length || 0,
      emails_sent: emailsSent,
    });

  } catch (error) {
    console.error('Check renewals cron error:', error);
    res.status(500).json({
      error: 'Cron job failed',
      message: error.message,
    });
  }
};


