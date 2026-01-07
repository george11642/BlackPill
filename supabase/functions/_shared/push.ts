/**
 * Push notification utilities
 * Supports Expo Push and Web Push
 */

interface ExpoPushMessage {
  to: string;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

interface PushResult {
  success: boolean;
  error?: string;
}

/**
 * Send push notification via Expo
 */
export async function sendExpoPush(message: ExpoPushMessage): Promise<PushResult> {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.message || "Failed to send push" };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ExpoPush] Error:", message);
    return { success: false, error: message };
  }
}

/**
 * Send batch push notifications via Expo
 */
export async function sendExpoPushBatch(
  messages: ExpoPushMessage[]
): Promise<PushResult[]> {
  if (messages.length === 0) return [];

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return messages.map(() => ({
        success: false,
        error: error.message || "Failed to send push",
      }));
    }

    const data = await response.json();
    return data.data?.map((result: { status: string; message?: string }) => ({
      success: result.status === "ok",
      error: result.status !== "ok" ? result.message : undefined,
    })) || messages.map(() => ({ success: true }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return messages.map(() => ({ success: false, error: errorMessage }));
  }
}

/**
 * Check if token is an Expo push token
 */
export function isExpoPushToken(token: string): boolean {
  return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
}

/**
 * Send notification to user by fetching their push tokens
 */
export async function sendNotificationToUser(
  supabaseAdmin: { from: (table: string) => unknown },
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<PushResult[]> {
  // Get user's push tokens
  const { data: tokens, error } = await (supabaseAdmin as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => Promise<{ data: Array<{ token: string }> | null; error: Error | null }>;
      };
    };
  })
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId);

  if (error || !tokens || tokens.length === 0) {
    return [{ success: false, error: "No push tokens found" }];
  }

  const results: PushResult[] = [];

  for (const { token } of tokens) {
    if (isExpoPushToken(token)) {
      const result = await sendExpoPush({
        to: token,
        title,
        body,
        data,
        sound: "default",
      });
      results.push(result);
    }
  }

  return results;
}
