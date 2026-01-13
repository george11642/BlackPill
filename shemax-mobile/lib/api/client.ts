import { getApiUrl, normalizeEndpoint, isUsingSupabase } from '../utils/apiUrl';
import * as SupabaseAPI from '../supabase/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Routes that should use direct Supabase client (BaaS model)
 * These bypass the HTTP layer entirely for better performance
 */
type DirectSupabaseRoute = {
  pattern: RegExp | string;
  handler: (params: RouteParams) => Promise<unknown>;
};

type RouteParams = {
  method: string;
  endpoint: string;
  data?: Record<string, unknown>;
  matches?: RegExpMatchArray;
};

const directSupabaseRoutes: DirectSupabaseRoute[] = [
  // Analyses - handle query params for limit/offset
  { pattern: /^\/api\/analyses\/history/, handler: () => SupabaseAPI.getAnalysesHistory() },
  { pattern: /^\/api\/analyses\/([^\/]+)\/visibility$/, handler: ({ data, matches }) =>
    SupabaseAPI.updateAnalysisVisibility(matches![1], data?.is_public) },
  { pattern: /^\/api\/analyses\/([^\/]+)$/, handler: ({ method, matches }) =>
    method === 'DELETE' ? SupabaseAPI.deleteAnalysis(matches![1]) : SupabaseAPI.getAnalysisById(matches![1]) },
  // Handle /api/analyses with optional query params (limit, offset)
  { pattern: /^\/api\/analyses(\?.*)?$/, handler: ({ endpoint }) => {
    const url = new URL(endpoint, 'http://localhost');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    return SupabaseAPI.getAnalysesHistory(limit, offset);
  }},

  // AI Coach - route chat to Edge Function
  { pattern: /^\/api\/ai-coach\/chat$/, handler: async ({ data }) => {
    const { supabase } = await import('../supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');

    const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!SUPABASE_URL) {
      throw new Error('EXPO_PUBLIC_SUPABASE_URL environment variable is not set');
    }
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai?action=coach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }},
  // AI Coach Conversations (CRUD only)
  { pattern: /^\/api\/ai-coach\/conversations\/([^\/]+)$/, handler: ({ method, matches }) =>
    method === 'DELETE' ? SupabaseAPI.deleteConversation(matches![1]) : SupabaseAPI.getConversationById(matches![1]) },
  { pattern: /^\/api\/ai-coach\/conversations$/, handler: () => SupabaseAPI.getConversations() },
  { pattern: /^\/api\/ai-coach\/messages/, handler: ({ data }) =>
    SupabaseAPI.getMessages(data?.conversation_id) },

  // Routines
  { pattern: /^\/api\/routines\/generate$/, handler: async ({ data }) => {
    const { supabase } = await import('../supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');

    const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!SUPABASE_URL) {
      throw new Error('EXPO_PUBLIC_SUPABASE_URL environment variable is not set');
    }
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai?action=routines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }},
  { pattern: /^\/api\/routines\/today\/tasks/, handler: () => SupabaseAPI.getTodayTasks() },
  { pattern: /^\/api\/routines\/complete-task/, handler: ({ data }) =>
    SupabaseAPI.completeTask(data?.task_id) },
  { pattern: /^\/api\/routines\/([^\/]+)$/, handler: ({ method, matches }) =>
    method === 'DELETE' ? SupabaseAPI.deleteRoutine(matches![1]) : SupabaseAPI.getRoutineById(matches![1]) },
  { pattern: /^\/api\/routines$/, handler: () => SupabaseAPI.getRoutines() },

  // Goals
  { pattern: /^\/api\/goals\/types/, handler: () => SupabaseAPI.getGoalTypes() },
  { pattern: /^\/api\/goals\/create/, handler: ({ data }) => SupabaseAPI.createGoal(data) },
  { pattern: /^\/api\/goals\/([^\/]+)\/progress/, handler: ({ data, matches }) =>
    SupabaseAPI.updateGoalProgress(matches![1], data?.current_value) },
  { pattern: /^\/api\/goals\/([^\/]+)$/, handler: ({ method, matches }) =>
    method === 'DELETE' ? SupabaseAPI.deleteGoal(matches![1]) : SupabaseAPI.getGoalById(matches![1]) },
  { pattern: /^\/api\/goals$/, handler: () => SupabaseAPI.getGoals() },

  // Challenges
  { pattern: /^\/api\/challenges\/join/, handler: ({ data }) => SupabaseAPI.joinChallenge(data?.challenge_id) },
  { pattern: /^\/api\/challenges\/checkin/, handler: ({ data }) =>
    SupabaseAPI.challengeCheckin(data?.challenge_id, data?.proof_image_url, data?.notes) },
  { pattern: /^\/api\/challenges\/([^\/]+)\/participants/, handler: ({ matches }) =>
    SupabaseAPI.getChallengeParticipants(matches![1]) },
  { pattern: /^\/api\/challenges\/([^\/]+)$/, handler: ({ matches }) => SupabaseAPI.getChallengeById(matches![1]) },
  { pattern: /^\/api\/challenges$/, handler: () => SupabaseAPI.getChallenges() },

  // Achievements
  { pattern: /^\/api\/achievements$/, handler: () => SupabaseAPI.getAchievements() },

  // User
  { pattern: /^\/api\/user\/stats/, handler: () => SupabaseAPI.getUserStats() },
  { pattern: /^\/api\/user\/onboarding/, handler: ({ data }) => SupabaseAPI.updateOnboarding(data) },
  { pattern: /^\/api\/user\/push-token/, handler: ({ data }) => SupabaseAPI.updatePushToken(data?.token) },

  // Ethical Settings
  { pattern: /^\/api\/ethical\/settings/, handler: ({ method, data }) =>
    method === 'PUT' ? SupabaseAPI.updateEthicalSettings(data) : SupabaseAPI.getEthicalSettings() },

  // Checkins
  { pattern: /^\/api\/checkins\/checkin/, handler: ({ data }) =>
    SupabaseAPI.createCheckin(data?.wellness_rating, data?.notes, data?.mood) },
  { pattern: /^\/api\/checkins\/history/, handler: () => SupabaseAPI.getCheckinHistory() },

  // Wellness
  { pattern: /^\/api\/wellness\/data/, handler: () => SupabaseAPI.getWellnessData() },
  { pattern: /^\/api\/wellness\/sync/, handler: ({ data }) => SupabaseAPI.syncWellnessData(data) },

  // Products
  { pattern: /^\/api\/products\/click/, handler: ({ data }) =>
    SupabaseAPI.recordProductClick(data?.product_id || data?.productId) }, // Handle both naming conventions
  { pattern: /^\/api\/products\/recommend$/, handler: async ({ data }) => {
    // Route to Edge Function for AI-powered recommendations
    const { supabase } = await import('../supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');

    const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!SUPABASE_URL) {
      throw new Error('EXPO_PUBLIC_SUPABASE_URL environment variable is not set');
    }
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai?action=recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }},
  { pattern: /^\/api\/products(\?.*)?$/, handler: ({ endpoint }) => {
    const url = new URL(endpoint, 'http://localhost');
    return SupabaseAPI.getProducts({
      category: url.searchParams.get('category') || undefined,
      search: url.searchParams.get('search') || undefined,
      featured: url.searchParams.get('featured') === 'true' ? true : undefined,
      limit: parseInt(url.searchParams.get('limit') || '50', 10),
      offset: parseInt(url.searchParams.get('offset') || '0', 10),
    });
  }},
];

/**
 * Try to handle request via direct Supabase client
 * Returns null if endpoint should use HTTP instead
 */
async function tryDirectSupabase<T>(
  endpoint: string,
  method: string,
  data?: Record<string, unknown>
): Promise<T | null> {
  if (!isUsingSupabase()) {
    return null;
  }

  for (const route of directSupabaseRoutes) {
    const pattern = typeof route.pattern === 'string'
      ? new RegExp(`^${route.pattern}$`)
      : route.pattern;

    const matches = endpoint.match(pattern);
    if (matches) {
      console.log('[API] Using direct Supabase for:', method, endpoint);
      try {
        const result = await route.handler({ method, endpoint, data, matches });
        return result as T;
      } catch (error) {
        console.error('[API] Direct Supabase error:', error);
        const err = error as { message?: string; code?: string };
        throw new ApiError(
          err.message || 'Supabase operation failed',
          err.code === 'PGRST116' ? 404 : 500,
          error instanceof Error ? { message: error.message } : {}
        );
      }
    }
  }

  return null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiUrl = getApiUrl();
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const url = `${apiUrl}${normalizedEndpoint}`;
  
  // Debug logging for API URL resolution
  console.log('[API] Request:', options.method || 'GET', endpoint, '-> Full URL:', url);
  
  // Don't set Content-Type for FormData - let the browser set it with boundary
  const isFormData = options.body instanceof FormData;
  const headers = isFormData
    ? { ...options.headers }
    : {
        'Content-Type': 'application/json',
        ...options.headers,
      };
  
  // Log Authorization header presence (not the actual token for security)
  const authHeader = (options.headers as Record<string, string>)?.Authorization;
  console.log('[API] Authorization header:', {
    present: !!authHeader,
    startsWithBearer: authHeader?.startsWith('Bearer ') || false,
    tokenLength: authHeader ? authHeader.length - 7 : 0, // Subtract "Bearer " length
  });
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || `HTTP ${response.status}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

export async function apiGet<T>(endpoint: string, token?: string): Promise<T> {
  // Try direct Supabase first
  const directResult = await tryDirectSupabase<T>(endpoint, 'GET');
  if (directResult !== null) {
    return directResult;
  }

  return request<T>(endpoint, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiPost<T>(
  endpoint: string,
  data?: Record<string, unknown> | FormData,
  token?: string
): Promise<T> {
  // Try direct Supabase first (except for FormData which needs HTTP)
  if (!(data instanceof FormData)) {
    const directResult = await tryDirectSupabase<T>(endpoint, 'POST', data);
    if (directResult !== null) {
      return directResult;
    }
  }

  const isFormData = data instanceof FormData;
  const body = isFormData ? data : (data ? JSON.stringify(data) : undefined);

  return request<T>(endpoint, {
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiPut<T>(
  endpoint: string,
  data?: Record<string, unknown>,
  token?: string
): Promise<T> {
  // Try direct Supabase first
  const directResult = await tryDirectSupabase<T>(endpoint, 'PUT', data);
  if (directResult !== null) {
    return directResult;
  }

  return request<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiDelete<T>(
  endpoint: string,
  token?: string
): Promise<T> {
  // Try direct Supabase first
  const directResult = await tryDirectSupabase<T>(endpoint, 'DELETE');
  if (directResult !== null) {
    return directResult;
  }

  return request<T>(endpoint, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiPatch<T>(
  endpoint: string,
  data?: Record<string, unknown>,
  token?: string
): Promise<T> {
  // Try direct Supabase first
  const directResult = await tryDirectSupabase<T>(endpoint, 'PATCH', data);
  if (directResult !== null) {
    return directResult;
  }

  return request<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

