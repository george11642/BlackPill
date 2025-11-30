import { NextRequest } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/goals/types
 * Get available goal types, prioritized by user's weakest analysis categories
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  const requestId = getRequestId(request);

  try {
    // Fetch user's latest analysis
    const { data: latestAnalysis, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .select('breakdown, score')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysisError) throw analysisError;

    // Define all goal type templates with metadata
    const categoryGoals = [
      {
        id: 'masculinity',
        label: 'Masculinity',
        icon: 'Activity',
        unit: 'pts',
        category: 'masculinity',
        order: 10,
      },
      {
        id: 'skin',
        label: 'Skin Quality',
        icon: 'Activity',
        unit: 'pts',
        category: 'skin',
        order: 11,
      },
      {
        id: 'jawline',
        label: 'Jawline',
        icon: 'Activity',
        unit: 'pts',
        category: 'jawline',
        order: 12,
      },
      {
        id: 'cheekbones',
        label: 'Cheekbones',
        icon: 'Activity',
        unit: 'pts',
        category: 'cheekbones',
        order: 13,
      },
      {
        id: 'eyes',
        label: 'Eyes',
        icon: 'Activity',
        unit: 'pts',
        category: 'eyes',
        order: 14,
      },
      {
        id: 'symmetry',
        label: 'Symmetry',
        icon: 'Activity',
        unit: 'pts',
        category: 'symmetry',
        order: 15,
      },
      {
        id: 'lips',
        label: 'Lips',
        icon: 'Activity',
        unit: 'pts',
        category: 'lips',
        order: 16,
      },
      {
        id: 'hair',
        label: 'Hair',
        icon: 'Activity',
        unit: 'pts',
        category: 'hair',
        order: 17,
      },
    ];

    // Fixed goal types (always included)
    const fixedGoals = [
      {
        id: 'score',
        label: 'Overall Score',
        icon: 'Activity',
        unit: 'pts',
        order: 0,
        currentScore: latestAnalysis?.score || null,
      },
      {
        id: 'routine',
        label: 'Routine Consistency',
        icon: 'Target',
        unit: '%',
        order: 1,
      },
    ];

    // If user has analysis data, prioritize by lowest scores
    let categoriesSorted = categoryGoals;
    if (latestAnalysis?.breakdown) {
      const breakdown = latestAnalysis.breakdown as Record<string, any>;
      
      // Calculate priority for each category based on score (lowest = highest priority)
      const categoriesWithScores = categoryGoals.map((goal) => {
        let score = 5; // Default score if not found
        
        // Get score from breakdown, handling both direct numbers and object scores
        const categoryData = breakdown[goal.category];
        if (typeof categoryData === 'number') {
          score = categoryData;
        } else if (categoryData && typeof categoryData === 'object' && 'score' in categoryData) {
          score = categoryData.score;
        }
        
        return {
          ...goal,
          currentScore: score,
          priority: score, // Lower score = higher priority
        };
      });

      // Sort by score (ascending = weakest first)
      categoriesSorted = categoriesWithScores.sort((a, b) => a.priority - b.priority);
    }

    // Combine: fixed goals first, then prioritized categories
    const allGoalTypes = [
      ...fixedGoals,
      ...categoriesSorted,
    ];

    return createResponseWithId(
      {
        goal_types: allGoalTypes,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get goal types error:', error);
    return handleApiError(error, request);
  }
});

