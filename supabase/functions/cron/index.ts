/**
 * Cron Edge Function - Consolidated scheduled jobs
 *
 * Jobs (via query param ?job=):
 * - daily-morning: Morning routine reminders (08:00)
 * - daily-evening: Evening reminders & streak check (20:00)
 * - check-renewals: Subscription renewal reminders (00:00)
 * - recalculate-leaderboard: Weekly leaderboard (Sunday 00:00)
 * - generate-insights: AI insights for users (weekly)
 * - goal-reminders: Goal deadline reminders (daily)
 *
 * All jobs require CRON_SECRET authorization
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.20.1";
import {
  handleCors,
  getRequestId,
  createResponseWithId,
  createErrorResponse,
  getSupabaseAdmin,
  verifyCronSecret,
  sendNotificationToUser,
  sendEmail,
} from "../_shared/index.ts";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCors();
  }

  const requestId = getRequestId(req);
  const url = new URL(req.url);
  const job = url.searchParams.get("job");

  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const expectedSecret = Deno.env.get("CRON_SECRET");

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return createErrorResponse("Unauthorized", 401, requestId);
    }

    const supabaseAdmin = getSupabaseAdmin();

    switch (job) {
      case "daily-morning":
        return await handleDailyMorning(supabaseAdmin, requestId);
      case "daily-evening":
        return await handleDailyEvening(supabaseAdmin, requestId);
      case "check-renewals":
        return await handleCheckRenewals(supabaseAdmin, requestId);
      case "recalculate-leaderboard":
        return await handleRecalculateLeaderboard(supabaseAdmin, requestId);
      case "generate-insights":
        return await handleGenerateInsights(supabaseAdmin, requestId);
      case "goal-reminders":
        return await handleGoalReminders(supabaseAdmin, requestId);
      default:
        return createErrorResponse(
          "Invalid job. Use: daily-morning, daily-evening, check-renewals, recalculate-leaderboard, generate-insights, goal-reminders",
          400,
          requestId
        );
    }
  } catch (error) {
    console.error("[cron] Error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500,
      requestId
    );
  }
});

// ============ DAILY MORNING ============
async function handleDailyMorning(supabaseAdmin: any, requestId: string) {
  // Get users with active morning routines
  const { data: routines, error } = await supabaseAdmin
    .from("routines")
    .select(`
      id,
      user_id,
      name,
      routine_tasks!inner(id, name, time_of_day)
    `)
    .eq("is_active", true)
    .in("routine_tasks.time_of_day", ["morning", "both"]);

  if (error) throw error;

  // Group by user
  const userRoutineMap = new Map<string, any[]>();
  for (const routine of routines || []) {
    if (!userRoutineMap.has(routine.user_id)) {
      userRoutineMap.set(routine.user_id, []);
    }
    userRoutineMap.get(routine.user_id)!.push(routine);
  }

  let notificationsSent = 0;
  let errors = 0;

  for (const [userId, userRoutines] of userRoutineMap.entries()) {
    try {
      const taskCount = userRoutines.reduce(
        (sum: number, r: any) => sum + (r.routine_tasks?.length || 0),
        0
      );

      await sendNotificationToUser(
        userId,
        "Good morning",
        `Time to start your routine! You have ${taskCount} task${taskCount !== 1 ? "s" : ""} scheduled for this morning.`,
        { type: "routine_reminder", screen: "DailyRoutine" }
      );
      notificationsSent++;
    } catch (e) {
      console.error(`[cron] Morning notification failed for ${userId}:`, e);
      errors++;
    }
  }

  return createResponseWithId(
    {
      success: true,
      users_checked: userRoutineMap.size,
      notifications_sent: notificationsSent,
      errors,
    },
    200,
    requestId
  );
}

// ============ DAILY EVENING ============
async function handleDailyEvening(supabaseAdmin: any, requestId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split("T")[0];

  const { data: routines, error } = await supabaseAdmin
    .from("routines")
    .select(`
      id,
      user_id,
      name,
      routine_tasks!inner(
        id,
        name,
        time_of_day,
        routine_task_completions!left(id, completed_at)
      ),
      routine_streaks!inner(id, current_streak, last_completed_date)
    `)
    .eq("is_active", true);

  if (error) throw error;

  // Check for incomplete tasks
  const userReminderMap = new Map<
    string,
    { incompleteTasks: number; streak: number; routineNames: string[] }
  >();

  for (const routine of routines || []) {
    const userId = routine.user_id;
    const tasks = routine.routine_tasks || [];

    const incompleteTasks = tasks.filter((task: any) => {
      const completions = task.routine_task_completions || [];
      const hasTodayCompletion = completions.some((c: any) => {
        if (!c.completed_at) return false;
        const completionDate = new Date(c.completed_at).toISOString().split("T")[0];
        return completionDate === todayISO;
      });
      return !hasTodayCompletion;
    }).length;

    const streaks = routine.routine_streaks || [];
    const maxStreak =
      streaks.length > 0
        ? Math.max(...streaks.map((s: any) => s.current_streak || 0))
        : 0;

    if (incompleteTasks > 0) {
      if (!userReminderMap.has(userId)) {
        userReminderMap.set(userId, { incompleteTasks: 0, streak: maxStreak, routineNames: [] });
      }
      const userData = userReminderMap.get(userId)!;
      userData.incompleteTasks += incompleteTasks;
      userData.streak = Math.max(userData.streak, maxStreak);
      if (!userData.routineNames.includes(routine.name)) {
        userData.routineNames.push(routine.name);
      }
    }
  }

  let notificationsSent = 0;
  let errors = 0;

  for (const [userId, data] of userReminderMap.entries()) {
    try {
      const streakMessage =
        data.streak > 0
          ? `Don't lose your ${data.streak}-day streak!`
          : "Complete your tasks to start building a streak!";

      await sendNotificationToUser(
        userId,
        "Evening Reminder",
        `You have ${data.incompleteTasks} incomplete task${data.incompleteTasks !== 1 ? "s" : ""} today. ${streakMessage}`,
        { type: "streak_reminder", screen: "DailyRoutine" }
      );
      notificationsSent++;
    } catch (e) {
      console.error(`[cron] Evening notification failed for ${userId}:`, e);
      errors++;
    }
  }

  return createResponseWithId(
    {
      success: true,
      users_with_incomplete_tasks: userReminderMap.size,
      notifications_sent: notificationsSent,
      errors,
    },
    200,
    requestId
  );
}

// ============ CHECK RENEWALS ============
async function handleCheckRenewals(supabaseAdmin: any, requestId: string) {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const eightDaysFromNow = new Date();
  eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);

  const { data: subscriptions, error } = await supabaseAdmin
    .from("subscriptions")
    .select(`*, users!inner(email)`)
    .eq("status", "active")
    .gte("current_period_end", sevenDaysFromNow.toISOString())
    .lt("current_period_end", eightDaysFromNow.toISOString());

  if (error) throw error;

  const tierPrices: Record<string, number> = { pro: 12.99, elite: 19.99 };
  let emailsSent = 0;

  for (const sub of subscriptions || []) {
    try {
      const reminderKey = `renewal_reminder_${sub.id}_${sub.current_period_end}`;

      // Check if already sent
      const { data: existing } = await supabaseAdmin
        .from("support_tickets")
        .select("id")
        .eq("subject", reminderKey)
        .maybeSingle();

      if (existing) continue;

      const userEmail = (sub.users as any)?.email;
      if (!userEmail) continue;

      const renewalDate = new Date(sub.current_period_end).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await sendEmail({
        to: userEmail,
        subject: `Your BlackPill ${sub.tier} subscription renews soon`,
        html: `<p>Your BlackPill ${sub.tier} subscription ($${tierPrices[sub.tier] || 12.99}/mo) will renew on ${renewalDate}.</p>`,
      });

      // Mark as sent
      await supabaseAdmin.from("support_tickets").insert({
        user_id: sub.user_id,
        subject: reminderKey,
        message: "Renewal reminder sent",
        status: "closed",
      });

      emailsSent++;
    } catch (e) {
      console.error(`[cron] Renewal email failed for ${sub.id}:`, e);
    }
  }

  return createResponseWithId(
    {
      success: true,
      subscriptions_checked: subscriptions?.length || 0,
      emails_sent: emailsSent,
    },
    200,
    requestId
  );
}

// ============ RECALCULATE LEADERBOARD ============
async function handleRecalculateLeaderboard(supabaseAdmin: any, requestId: string) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const { data: analyses, error } = await supabaseAdmin
    .from("analyses")
    .select(`user_id, score, created_at, users!inner(username)`)
    .eq("is_public", true)
    .is("deleted_at", null)
    .gte("created_at", weekStart.toISOString());

  if (error) throw error;

  if (!analyses || analyses.length === 0) {
    return createResponseWithId(
      { success: true, week_starting: weekStart.toISOString(), rankings_created: 0 },
      200,
      requestId
    );
  }

  // Group by user, get highest score
  const userScores: Record<string, { user_id: string; score: number; created_at: string }> = {};

  for (const analysis of analyses) {
    if (!(analysis.users as any)?.username) continue;

    const userId = analysis.user_id;
    if (
      !userScores[userId] ||
      analysis.score > userScores[userId].score ||
      (analysis.score === userScores[userId].score &&
        new Date(analysis.created_at) < new Date(userScores[userId].created_at))
    ) {
      userScores[userId] = {
        user_id: userId,
        score: analysis.score,
        created_at: analysis.created_at,
      };
    }
  }

  const sortedUsers = Object.values(userScores).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Clear and insert
  const weekStartDate = weekStart.toISOString().split("T")[0];
  await supabaseAdmin
    .from("leaderboard_weekly")
    .delete()
    .eq("week_starting", weekStartDate);

  const rankings = sortedUsers.map((user, index) => ({
    user_id: user.user_id,
    score: user.score,
    rank: index + 1,
    week_starting: weekStartDate,
  }));

  await supabaseAdmin.from("leaderboard_weekly").insert(rankings);

  return createResponseWithId(
    { success: true, week_starting: weekStart.toISOString(), rankings_created: rankings.length },
    200,
    requestId
  );
}

// ============ GENERATE INSIGHTS ============
async function handleGenerateInsights(supabaseAdmin: any, requestId: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get active users
  const { data: activeUsers, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .gte("updated_at", sevenDaysAgo.toISOString())
    .limit(50);

  if (error) throw error;

  if (!activeUsers || activeUsers.length === 0) {
    return createResponseWithId(
      { success: true, users_processed: 0, insights_generated: 0 },
      200,
      requestId
    );
  }

  let insightsGenerated = 0;
  let errors = 0;

  for (const user of activeUsers) {
    try {
      // Check for recent insights
      const { data: recentInsights } = await supabaseAdmin
        .from("user_insights")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString())
        .limit(1);

      if (recentInsights && recentInsights.length > 0) continue;

      // Get analysis history
      const { data: analyses } = await supabaseAdmin
        .from("analyses")
        .select("score, breakdown, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!analyses || analyses.length < 2) continue;

      const scoreTrend = analyses.map((a: any) => ({
        score: parseFloat(a.score),
        date: a.created_at,
      }));

      const avgScore = scoreTrend.reduce((sum, s) => sum + s.score, 0) / scoreTrend.length;
      const recentAvg =
        scoreTrend.slice(0, 5).reduce((sum, s) => sum + s.score, 0) /
        Math.min(5, scoreTrend.length);
      const trend = recentAvg > avgScore ? "improving" : recentAvg < avgScore ? "declining" : "stable";

      const prompt = `Generate 3-5 insights for user data:
- ${analyses.length} analyses
- Average: ${avgScore.toFixed(1)}/10
- Trend: ${trend}
- Latest: ${scoreTrend[0]?.score}/10

Return JSON: {"insights": [{"insight_type": "correlation|timing|progress", "title": "", "description": "", "confidence_score": 0.0-1.0}]}`;

      const completion = await openai.chat.completions.create({
        model: Deno.env.get("OPENAI_MODEL") || "gpt-4o",
        messages: [
          { role: "system", content: "You are a data analyst. Be specific and actionable." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const aiResult = JSON.parse(completion.choices[0].message.content || "{}");
      const insights = aiResult.insights || [];

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      for (const insight of insights.slice(0, 5)) {
        await supabaseAdmin.from("user_insights").insert({
          user_id: user.id,
          insight_type: insight.insight_type || "correlation",
          title: insight.title,
          description: insight.description,
          confidence_score: Math.min(Math.max(parseFloat(insight.confidence_score) || 0.7, 0), 1),
          expires_at: expiresAt.toISOString(),
        });
        insightsGenerated++;
      }
    } catch (e) {
      console.error(`[cron] Insight generation failed for ${user.id}:`, e);
      errors++;
    }
  }

  return createResponseWithId(
    { success: true, users_processed: activeUsers.length, insights_generated: insightsGenerated, errors },
    200,
    requestId
  );
}

// ============ GOAL REMINDERS ============
async function handleGoalReminders(supabaseAdmin: any, requestId: string) {
  const today = new Date();
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);

  const { data: goals, error } = await supabaseAdmin
    .from("goals")
    .select("id, user_id, goal_type, target_value, current_value, deadline")
    .eq("status", "active")
    .lte("deadline", threeDaysFromNow.toISOString().split("T")[0])
    .gte("deadline", today.toISOString().split("T")[0]);

  if (error) throw error;

  if (!goals || goals.length === 0) {
    return createResponseWithId({ success: true, processed: 0 }, 200, requestId);
  }

  let processed = 0;
  let errors = 0;

  for (const goal of goals) {
    try {
      const deadline = new Date(goal.deadline);
      const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let body = "";
      if (daysLeft === 3) {
        body = "Your goal deadline is in 3 days! Keep pushing to reach your target.";
      } else if (daysLeft === 1) {
        body = "Your goal deadline is tomorrow! You're almost there!";
      } else if (daysLeft === 0) {
        body = "Today is your goal deadline! Finish strong!";
      } else {
        continue;
      }

      await sendNotificationToUser(goal.user_id, "Goal Reminder", body, {
        type: "goal_reminder",
        goal_id: goal.id,
        days_left: daysLeft,
      });
      processed++;
    } catch (e) {
      console.error(`[cron] Goal reminder failed for ${goal.id}:`, e);
      errors++;
    }
  }

  return createResponseWithId(
    { success: true, processed, total: goals.length, errors },
    200,
    requestId
  );
}
