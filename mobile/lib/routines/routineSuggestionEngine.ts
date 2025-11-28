import { apiGet } from '../api/client';

export interface Analysis {
  id: string;
  score: number;
  potential_score?: number;
  created_at: string;
  breakdown?: Record<string, number>;
}

export type SuggestionType = 
  | 'first_analysis' 
  | 'new_weak_area' 
  | 'declining_trend' 
  | 'no_routine'
  | 'improvement_opportunity'
  | 'no_suggestion';

export interface RoutineSuggestion {
  type: SuggestionType;
  message: string;
  actionLabel?: string;
  reason?: string;
  weakAreas?: string[];
  showAction: boolean;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Detect new weak areas by comparing current analysis with previous ones
 */
export function detectNewWeakAreas(
  currentAnalysis: Analysis,
  previousAnalyses: Analysis[]
): string[] {
  if (!currentAnalysis.breakdown) {
    return [];
  }

  // Get current weak areas (score < 7.0)
  const currentWeakAreas = Object.entries(currentAnalysis.breakdown)
    .filter(([, score]) => score < 7.0)
    .map(([area]) => area);

  if (previousAnalyses.length === 0) {
    return currentWeakAreas;
  }

  // Get all weak areas from previous analyses
  const previousWeakAreas = new Set(
    previousAnalyses.flatMap((a) => 
      Object.entries(a.breakdown || {})
        .filter(([, score]) => score < 7.0)
        .map(([area]) => area)
    )
  );

  // Find weak areas in current analysis not in previous
  return currentWeakAreas.filter((area) => !previousWeakAreas.has(area));
}

/**
 * Detect if there's a declining trend (3+ consecutive analyses with score decline)
 */
export function detectDecliningTrend(analyses: Analysis[]): { declining: boolean; drop: number } {
  if (analyses.length < 3) return { declining: false, drop: 0 };

  // Get last 3+ analyses sorted by date (oldest first)
  const recent = [...analyses]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-3);

  // Check if scores are consistently declining
  let declining = true;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].score >= recent[i - 1].score) {
      declining = false;
      break;
    }
  }

  // Calculate total decline
  const totalDecline = recent[0].score - recent[recent.length - 1].score;
  
  // Only consider it a declining trend if drop is significant (at least 0.5 points)
  return { 
    declining: declining && totalDecline >= 0.5, 
    drop: Math.round(totalDecline * 10) / 10 
  };
}

/**
 * Detect if there's significant improvement opportunity
 */
export function detectImprovementOpportunity(
  currentAnalysis: Analysis
): { hasOpportunity: boolean; gap: number; areas: string[] } {
  if (!currentAnalysis.breakdown) {
    return { hasOpportunity: false, gap: 0, areas: [] };
  }

  // Check gap between current and potential score
  const gap = (currentAnalysis.potential_score || 0) - currentAnalysis.score;
  
  // Get areas with biggest improvement potential (score < 6.0)
  const lowAreas = Object.entries(currentAnalysis.breakdown)
    .filter(([, score]) => score < 6.0)
    .sort((a, b) => a[1] - b[1])
    .map(([area]) => area);

  return {
    hasOpportunity: gap >= 1.5 || lowAreas.length >= 2,
    gap: Math.round(gap * 10) / 10,
    areas: lowAreas,
  };
}

/**
 * Main function to determine what routine suggestion to show
 */
export async function getRoutineSuggestion(
  accessToken: string | undefined,
  currentAnalysis: Analysis,
  hasActiveRoutine: boolean,
  previousAnalyses: Analysis[] = []
): Promise<RoutineSuggestion> {
  // If no active routine, always suggest creating one
  if (!hasActiveRoutine) {
    return {
      type: 'no_routine',
      message: 'Create a personalized routine based on your analysis to start improving.',
      actionLabel: 'Create Routine',
      showAction: true,
      priority: 'high',
    };
  }

  // Check if this is first analysis
  if (previousAnalyses.length === 0) {
    return {
      type: 'first_analysis',
      message: 'Great first scan! Your routine is tailored to your unique needs.',
      showAction: false,
      priority: 'low',
    };
  }

  // Check for new weak areas
  const newWeakAreas = detectNewWeakAreas(currentAnalysis, previousAnalyses);
  if (newWeakAreas.length > 0) {
    return {
      type: 'new_weak_area',
      message: newWeakAreas.length === 1
        ? `New area detected: ${newWeakAreas[0]}. Consider updating your routine.`
        : `${newWeakAreas.length} new areas detected. Consider updating your routine.`,
      actionLabel: 'Update Routine',
      reason: `New weak areas: ${newWeakAreas.join(', ')}`,
      weakAreas: newWeakAreas,
      showAction: true,
      priority: 'high',
    };
  }

  // Check for declining trend
  const allAnalyses = [...previousAnalyses, currentAnalysis];
  const { declining, drop } = detectDecliningTrend(allAnalyses);
  if (declining) {
    return {
      type: 'declining_trend',
      message: `Your score has dropped ${drop} points recently. Let's review your routine.`,
      actionLabel: 'Review Routine',
      reason: `Score declined ${drop} points over last ${Math.min(allAnalyses.length, 3)} analyses`,
      showAction: true,
      priority: 'high',
    };
  }

  // Check for improvement opportunity
  const { hasOpportunity, gap, areas } = detectImprovementOpportunity(currentAnalysis);
  if (hasOpportunity && areas.length > 0) {
    return {
      type: 'improvement_opportunity',
      message: `You have ${gap}+ point potential gain. Focus on: ${areas.slice(0, 2).join(', ')}.`,
      actionLabel: 'Optimize Routine',
      weakAreas: areas,
      showAction: true,
      priority: 'medium',
    };
  }

  // No suggestion needed - routine is working well
  return {
    type: 'no_suggestion',
    message: 'Your routine is working! Keep up the consistency.',
    showAction: false,
    priority: 'low',
  };
}

/**
 * Fetch routine suggestion data from API and compute suggestion
 */
export async function fetchRoutineSuggestion(
  accessToken: string | undefined,
  currentAnalysisId: string
): Promise<RoutineSuggestion | null> {
  try {
    // Fetch current analysis
    const analysisResponse = await apiGet<{ analysis: Analysis }>(
      `/api/analyses/${currentAnalysisId}`,
      accessToken
    );
    
    if (!analysisResponse.analysis) {
      return null;
    }

    // Fetch previous analyses
    const historyResponse = await apiGet<{ analyses: Analysis[] }>(
      '/api/analyses/history?limit=5',
      accessToken
    );
    
    const previousAnalyses = (historyResponse.analyses || [])
      .filter((a) => a.id !== currentAnalysisId);

    // Check if user has active routine
    const routineResponse = await apiGet<{ tasks: any[] }>(
      '/api/routines/today',
      accessToken
    );
    
    const hasActiveRoutine = (routineResponse.tasks || []).length > 0;

    return getRoutineSuggestion(
      accessToken,
      analysisResponse.analysis,
      hasActiveRoutine,
      previousAnalyses
    );
  } catch (error) {
    console.error('Failed to fetch routine suggestion:', error);
    return null;
  }
}

