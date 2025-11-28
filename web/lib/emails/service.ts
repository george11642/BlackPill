import { Resend } from 'resend';
import { config } from '../config';

const resend = config.resend.apiKey ? new Resend(config.resend.apiKey) : null;

/**
 * Send email using Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ id: string } | null> {
  if (!resend) {
    console.warn('Resend not configured, skipping email');
    return null;
  }

  try {
    const data = await resend.emails.send({
      from: 'Black Pill <noreply@black-pill.app>',
      to,
      subject,
      html,
    });

    return data;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

/**
 * Send auto-renewal reminder (7 days before renewal)
 */
export async function sendRenewalReminder(
  userEmail: string,
  subscriptionData: {
    tier: string;
    amount: number;
    renewal_date: string;
  }
): Promise<{ id: string } | null> {
  const { tier, amount, renewal_date } = subscriptionData;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #0F0F1E; color: #FFFFFF; padding: 40px; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { font-size: 28px; font-weight: 700; margin-bottom: 24px; }
        .content { font-size: 16px; line-height: 1.6; color: #B8BACC; }
        .cta { background: linear-gradient(135deg, #FF0080 0%, #00D9FF 100%); color: #FFFFFF; padding: 16px 32px; border-radius: 12px; text-decoration: none; display: inline-block; margin-top: 24px; font-weight: 600; }
        .footer { margin-top: 40px; font-size: 12px; color: #6B6D7F; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Your subscription renews soon</div>
        <div class="content">
          <p>Hi there,</p>
          <p>Your <strong>${tier}</strong> subscription will auto-renew on <strong>${renewal_date}</strong> for <strong>$${amount}</strong>.</p>
          <p>You'll continue to enjoy:</p>
          <ul>
            <li>Unlimited AI-powered facial analyses</li>
            <li>Detailed breakdowns and improvement tips</li>
            <li>Progress tracking and achievements</li>
            <li>Priority support</li>
          </ul>
          <p>No action needed - you're all set!</p>
          <p>Want to make changes? <a href="https://black-pill.app/settings" class="cta">Manage Subscription</a></p>
        </div>
        <div class="footer">
          <p>Black Pill - Be Honest About Yourself</p>
          <p><a href="https://black-pill.app/unsubscribe">Unsubscribe from emails</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Your ${tier} subscription renews in 7 days`,
    html,
  });
}

/**
 * Send payment failure notification
 */
export async function sendPaymentFailedEmail(
  userEmail: string,
  subscriptionData: { tier: string }
): Promise<{ id: string } | null> {
  const { tier } = subscriptionData;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #0F0F1E; color: #FFFFFF; padding: 40px; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { font-size: 28px; font-weight: 700; margin-bottom: 24px; color: #FFFF00; }
        .content { font-size: 16px; line-height: 1.6; color: #B8BACC; }
        .cta { background: linear-gradient(135deg, #FF0080 0%, #00D9FF 100%); color: #FFFFFF; padding: 16px 32px; border-radius: 12px; text-decoration: none; display: inline-block; margin-top: 24px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">⚠️ Payment Failed</div>
        <div class="content">
          <p>Hi there,</p>
          <p>We couldn't process your payment for the <strong>${tier}</strong> subscription.</p>
          <p>Please update your payment method to continue enjoying Black Pill.</p>
          <p><a href="https://black-pill.app/settings" class="cta">Update Payment Method</a></p>
          <p>If you have questions, contact us at support@black-pill.app</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Black Pill - Payment Failed',
    html,
  });
}

/**
 * Send affiliate referral conversion notification
 */
export async function sendAffiliateReferralSuccessEmail(
  affiliateEmail: string,
  referreeName: string,
  commissionAmount: number,
  commissionRate: number
): Promise<{ id: string } | null> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #0F0F1E; color: #FFFFFF; padding: 40px; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { font-size: 28px; font-weight: 700; margin-bottom: 24px; color: #00D9FF; }
        .content { font-size: 16px; line-height: 1.6; color: #B8BACC; }
        .highlight { background: rgba(0, 217, 255, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #00D9FF; margin: 24px 0; }
        .cta { background: linear-gradient(135deg, #FF0080 0%, #00D9FF 100%); color: #FFFFFF; padding: 16px 32px; border-radius: 12px; text-decoration: none; display: inline-block; margin-top: 24px; font-weight: 600; }
        .footer { margin-top: 40px; font-size: 12px; color: #6B6D7F; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">🎉 Referral Conversion!</div>
        <div class="content">
          <p>Congratulations!</p>
          <p><strong>${referreeName}</strong> just subscribed to Black Pill using your referral link!</p>
          <div class="highlight">
            <p style="margin: 0;"><strong>Commission Earned:</strong></p>
            <p style="margin: 12px 0 0 0; font-size: 24px; color: #00D9FF;">$${commissionAmount.toFixed(2)}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #B8BACC;">${commissionRate}% of their first month</p>
          </div>
          <p>This will be paid out with your next commission cycle. Keep sharing to earn more!</p>
          <p><a href="https://black-pill.app/dashboard/affiliate" class="cta">View Your Dashboard</a></p>
        </div>
        <div class="footer">
          <p>Black Pill Affiliate Program</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: affiliateEmail,
    subject: `🎉 You earned $${commissionAmount.toFixed(2)} from a referral!`,
    html,
  });
}

/**
 * Send affiliate tier upgrade notification
 */
export async function sendAffiliateCommissionTierUpgradeEmail(
  affiliateEmail: string,
  newTier: string,
  newRate: number,
  totalReferrals: number
): Promise<{ id: string } | null> {
  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'tier_3':
        return 'Tier 3 - Elite Affiliate';
      case 'tier_2':
        return 'Tier 2 - Pro Affiliate';
      default:
        return 'Base Tier';
    }
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #0F0F1E; color: #FFFFFF; padding: 40px; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { font-size: 28px; font-weight: 700; margin-bottom: 24px; color: #FFD700; }
        .content { font-size: 16px; line-height: 1.6; color: #B8BACC; }
        .highlight { background: rgba(255, 215, 0, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #FFD700; margin: 24px 0; }
        .cta { background: linear-gradient(135deg, #FF0080 0%, #00D9FF 100%); color: #FFFFFF; padding: 16px 32px; border-radius: 12px; text-decoration: none; display: inline-block; margin-top: 24px; font-weight: 600; }
        .footer { margin-top: 40px; font-size: 12px; color: #6B6D7F; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">⭐ You've Been Promoted!</div>
        <div class="content">
          <p>Great news!</p>
          <p>You've reached the ${getTierLabel(newTier)} level and your commission rate has increased!</p>
          <div class="highlight">
            <p style="margin: 0;"><strong>New Commission Rate:</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 24px; color: #FFD700;">${newRate}%</p>
            <p style="margin: 12px 0 0 0; font-size: 14px;">You now have <strong>${totalReferrals} active referrals</strong></p>
          </div>
          <p>Keep sharing and earning! As you grow your network, your earnings grow too.</p>
          <p><a href="https://black-pill.app/dashboard/affiliate" class="cta">View Your Dashboard</a></p>
        </div>
        <div class="footer">
          <p>Black Pill Affiliate Program</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: affiliateEmail,
    subject: `⭐ Congratulations! You're now ${getTierLabel(newTier)} - ${newRate}% commission`,
    html,
  });
}

