/**
 * Email utilities using Resend
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface ResendResponse {
  id?: string;
  error?: string;
}

/**
 * Send email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<ResendResponse> {
  const apiKey = Deno.env.get("RESEND_API_KEY");

  if (!apiKey) {
    console.error("[Resend] API key not configured");
    return { error: "Email service not configured" };
  }

  const fromEmail = options.from || "BlackPill <noreply@black-pill.app>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Resend] Failed to send email:", errorData);
      return { error: errorData.message || "Failed to send email" };
    }

    const data = await response.json();
    return { id: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Resend] Error sending email:", message);
    return { error: message };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  name?: string
): Promise<ResendResponse> {
  return sendEmail({
    to: email,
    subject: "Welcome to BlackPill!",
    html: `
      <h1>Welcome${name ? `, ${name}` : ""}!</h1>
      <p>Thank you for joining BlackPill. We're excited to help you on your self-improvement journey.</p>
      <p>Get started by taking your first facial analysis to establish your baseline.</p>
      <p>Best,<br>The BlackPill Team</p>
    `,
  });
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionEmail(
  email: string,
  tier: string
): Promise<ResendResponse> {
  const tierNames: Record<string, string> = {
    pro: "Pro",
    elite: "Elite",
  };

  return sendEmail({
    to: email,
    subject: `Welcome to BlackPill ${tierNames[tier] || tier}!`,
    html: `
      <h1>Subscription Confirmed!</h1>
      <p>Your ${tierNames[tier] || tier} subscription is now active.</p>
      <p>You now have access to all premium features. Enjoy!</p>
      <p>Best,<br>The BlackPill Team</p>
    `,
  });
}
