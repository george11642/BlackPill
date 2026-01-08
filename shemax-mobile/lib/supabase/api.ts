/**
 * Supabase Direct API
 *
 * This module provides direct Supabase database access for CRUD operations,
 * replacing the need for web API routes. Uses Row Level Security (RLS) for authorization.
 *
 * For complex operations requiring server-side logic (AI, webhooks, etc.),
 * use the Edge Functions via the apiClient.
 */

import { supabase } from './client';

// ============================================================================
// ANALYSES
// ============================================================================

export interface Analysis {
  id: string;
  user_id: string;
  overall_score: number;
  image_url?: string;
  facial_features?: Record<string, any>;
  recommendations?: string[];
  is_public?: boolean;
  created_at: string;
}

/**
 * Get analysis history for the current user
 */
export async function getAnalysesHistory(limit = 50, offset = 0): Promise<Analysis[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[Supabase] Error fetching analyses:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single analysis by ID
 */
export async function getAnalysisById(id: string): Promise<Analysis | null> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Supabase] Error fetching analysis:', error);
    throw error;
  }

  return data;
}

/**
 * Delete an analysis
 */
export async function deleteAnalysis(id: string): Promise<void> {
  const { error } = await supabase
    .from('analyses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Error deleting analysis:', error);
    throw error;
  }
}

/**
 * Update analysis visibility
 */
export async function updateAnalysisVisibility(id: string, isPublic: boolean): Promise<void> {
  const { error } = await supabase
    .from('analyses')
    .update({ is_public: isPublic })
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Error updating analysis visibility:', error);
    throw error;
  }
}

// ============================================================================
// ROUTINES
// ============================================================================

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  frequency: string;
  tasks?: RoutineTask[];
  created_at: string;
}

export interface RoutineTask {
  id: string;
  routine_id: string;
  title: string;
  description?: string;
  category?: string;
  order_index: number;
  completed_at?: string;
  scheduled_date?: string;
}

/**
 * Get all routines for the current user
 */
export async function getRoutines(): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('routines')
    .select('*, tasks:routine_tasks(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching routines:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single routine by ID
 */
export async function getRoutineById(id: string): Promise<Routine | null> {
  const { data, error } = await supabase
    .from('routines')
    .select('*, tasks:routine_tasks(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Supabase] Error fetching routine:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a routine
 */
export async function deleteRoutine(id: string): Promise<void> {
  const { error } = await supabase
    .from('routines')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Error deleting routine:', error);
    throw error;
  }
}

/**
 * Get today's tasks
 */
export async function getTodayTasks(): Promise<RoutineTask[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('routine_tasks')
    .select('*, routine:routines(name)')
    .gte('scheduled_date', today)
    .lt('scheduled_date', new Date(Date.now() + 86400000).toISOString().split('T')[0])
    .order('order_index');

  if (error) {
    console.error('[Supabase] Error fetching today tasks:', error);
    throw error;
  }

  return data || [];
}

/**
 * Complete a task
 */
export async function completeTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('routine_tasks')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', taskId);

  if (error) {
    console.error('[Supabase] Error completing task:', error);
    throw error;
  }
}

// ============================================================================
// GOALS
// ============================================================================

export interface Goal {
  id: string;
  user_id: string;
  goal_type_id: string;
  title: string;
  target_value?: number;
  current_value?: number;
  deadline?: string;
  status: string;
  created_at: string;
}

export interface GoalType {
  id: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
}

/**
 * Get all goals for the current user
 */
export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*, goal_type:goal_types(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching goals:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get goal types
 */
export async function getGoalTypes(): Promise<GoalType[]> {
  const { data, error } = await supabase
    .from('goal_types')
    .select('*')
    .order('name');

  if (error) {
    console.error('[Supabase] Error fetching goal types:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new goal
 */
export async function createGoal(goal: Partial<Goal>): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .insert(goal)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error creating goal:', error);
    throw error;
  }

  return data;
}

/**
 * Get a single goal by ID
 */
export async function getGoalById(id: string): Promise<Goal | null> {
  const { data, error } = await supabase
    .from('goals')
    .select('*, goal_type:goal_types(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Supabase] Error fetching goal:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a goal
 */
export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Error deleting goal:', error);
    throw error;
  }
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(id: string, currentValue: number): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .update({ current_value: currentValue })
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Error updating goal progress:', error);
    throw error;
  }
}

// ============================================================================
// CHALLENGES
// ============================================================================

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  category?: string;
  difficulty?: string;
  participant_count?: number;
}

/**
 * Get all challenges
 */
export async function getChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching challenges:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single challenge by ID
 */
export async function getChallengeById(id: string): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Supabase] Error fetching challenge:', error);
    throw error;
  }

  return data;
}

/**
 * Get challenge participants
 */
export async function getChallengeParticipants(challengeId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('challenge_participants')
    .select('*, user:users(id, username, avatar_url)')
    .eq('challenge_id', challengeId)
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching challenge participants:', error);
    throw error;
  }

  return data || [];
}

/**
 * Join a challenge
 */
export async function joinChallenge(challengeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('challenge_participants')
    .insert({
      challenge_id: challengeId,
      user_id: user.id,
      joined_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[Supabase] Error joining challenge:', error);
    throw error;
  }
}

/**
 * Check in to a challenge
 */
export async function challengeCheckin(challengeId: string, proofImageUrl?: string, notes?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('challenge_checkins')
    .insert({
      challenge_id: challengeId,
      user_id: user.id,
      proof_image_url: proofImageUrl,
      notes,
      checked_in_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[Supabase] Error checking in to challenge:', error);
    throw error;
  }
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  points?: number;
  category?: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

/**
 * Get user achievements
 */
export async function getUserAchievements(): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*, achievement:achievements(*)')
    .order('unlocked_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching achievements:', error);
    throw error;
  }

  return data || [];
}

// Alias for API client compatibility
export const getAchievements = getUserAchievements;

// ============================================================================
// AI COACH
// ============================================================================

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

/**
 * Get conversations for the current user
 */
export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching conversations:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single conversation by ID
 */
export async function getConversationById(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Supabase] Error fetching conversation:', error);
    throw error;
  }

  return data;
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Supabase] Error fetching messages:', error);
    throw error;
  }

  return data || [];
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Error deleting conversation:', error);
    throw error;
  }
}

// ============================================================================
// USER
// ============================================================================

export interface UserStats {
  total_analyses: number;
  current_streak: number;
  longest_streak: number;
  avg_score?: number;
  best_score?: number;
  score_improvement?: number;
}

export interface UserProfile {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
}

/**
 * Get user stats
 */
export async function getUserStats(): Promise<UserStats | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('total_analyses, current_streak, longest_streak, avg_score, best_score, score_improvement')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[Supabase] Error fetching user stats:', error);
    throw error;
  }

  return data;
}

/**
 * Get user onboarding status
 */
export async function getOnboardingStatus(): Promise<{ onboarding_completed: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.warn('[Supabase] No authenticated user for onboarding status');
    return { onboarding_completed: false };
  }

  const { data, error } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[Supabase] Error fetching onboarding status:', error);
    // Return false on error to show onboarding screen
    return { onboarding_completed: false };
  }

  return { onboarding_completed: data?.onboarding_completed === true };
}

/**
 * Update user onboarding data
 */
export async function updateOnboarding(data: Record<string, any>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Map field names from app to database schema
  const updateData: Record<string, any> = {
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
  };

  // Map avatarUri to avatar_url (database column name)
  if (data.avatarUri !== undefined) {
    updateData.avatar_url = data.avatarUri;
  }

  // Map username if provided
  if (data.username !== undefined) {
    updateData.username = data.username;
  }

  // Store selected goals as JSON (if goals column exists)
  if (data.goals !== undefined) {
    updateData.selected_goals = data.goals;
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', user.id);

  if (error) {
    console.error('[Supabase] Error updating onboarding:', error);
    throw error;
  }
}

/**
 * Update push notification token
 */
export async function updatePushToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('users')
    .update({ push_token: token })
    .eq('id', user.id);

  if (error) {
    console.error('[Supabase] Error updating push token:', error);
    throw error;
  }
}

// ============================================================================
// ETHICAL SETTINGS
// ============================================================================

export interface EthicalSettings {
  user_id: string;
  wellness_reminders_enabled: boolean;
  content_sensitivity_level: string;
  daily_limit_enabled: boolean;
  daily_limit_minutes?: number;
}

/**
 * Get ethical settings
 */
export async function getEthicalSettings(): Promise<EthicalSettings | null> {
  const { data, error } = await supabase
    .from('user_ethical_settings')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('[Supabase] Error fetching ethical settings:', error);
    throw error;
  }

  return data;
}

/**
 * Update ethical settings
 */
export async function updateEthicalSettings(settings: Partial<EthicalSettings>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_ethical_settings')
    .upsert({
      user_id: user.id,
      ...settings,
    });

  if (error) {
    console.error('[Supabase] Error updating ethical settings:', error);
    throw error;
  }
}

// ============================================================================
// CHECKINS
// ============================================================================

/**
 * Create a daily checkin
 */
export async function createCheckin(wellnessRating?: number, notes?: string, mood?: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('checkins')
    .insert({
      user_id: user.id,
      wellness_rating: wellnessRating,
      notes,
      mood,
      checked_in_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[Supabase] Error creating checkin:', error);
    throw error;
  }
}

/**
 * Get checkin history
 */
export async function getCheckinHistory(days = 30): Promise<any[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .gte('checked_in_at', startDate.toISOString())
    .order('checked_in_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching checkin history:', error);
    throw error;
  }

  return data || [];
}

// ============================================================================
// WELLNESS
// ============================================================================

export interface WellnessData {
  id: string;
  user_id: string;
  date: string;
  sleep_hours?: number;
  exercise_minutes?: number;
  water_intake?: number;
  mood?: number;
}

/**
 * Get wellness data
 */
export async function getWellnessData(days = 30): Promise<WellnessData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('wellness_data')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching wellness data:', error);
    throw error;
  }

  return data || [];
}

/**
 * Sync wellness data
 */
export async function syncWellnessData(data: Partial<WellnessData>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('wellness_data')
    .upsert({
      user_id: user.id,
      date: today,
      ...data,
    }, {
      onConflict: 'user_id,date',
    });

  if (error) {
    console.error('[Supabase] Error syncing wellness data:', error);
    throw error;
  }
}

// ============================================================================
// PRODUCTS
// ============================================================================

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price?: number;
  currency: string;
  affiliate_link: string;
  affiliate_url?: string; // Legacy alias for affiliate_link
  image_url?: string;
  rating?: number;
  review_count: number;
  recommended_for?: string[];
  is_featured: boolean;
}

/**
 * Get products
 * Returns { products, total } format for API compatibility
 */
export async function getProducts(options?: {
  category?: string;
  search?: string;
  featured?: boolean;
  recommended_for?: string;
  limit?: number;
  offset?: number;
}): Promise<{ products: Product[]; total: number }> {
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order('name');

  if (options?.category) {
    query = query.eq('category', options.category);
  }

  if (options?.featured) {
    query = query.eq('is_featured', true);
  }

  if (options?.recommended_for) {
    query = query.contains('recommended_for', [options.recommended_for]);
  }

  if (options?.search) {
    query = query.ilike('name', `%${options.search}%`);
  }

  if (options?.limit) {
    const offset = options?.offset || 0;
    query = query.range(offset, offset + options.limit - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[Supabase] Error fetching products:', error);
    throw error;
  }

  return { products: data || [], total: count || 0 };
}

/**
 * Track product click
 */
export async function trackProductClick(productId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('product_clicks')
    .insert({
      product_id: productId,
      user_id: user?.id || null,
      clicked_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[Supabase] Error tracking product click:', error);
    // Don't throw - this is analytics, not critical
  }
}

// Alias for API client compatibility
export const recordProductClick = trackProductClick;
