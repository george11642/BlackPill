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

