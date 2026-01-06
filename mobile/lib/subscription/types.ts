export type SubscriptionTier = 'free' | 'premium';

export interface FeatureAccess {
  analyses: {
    unblurredCount: number; // 0 for free (unless credits used), 30 for premium
    totalCount: 'unlimited'; // All tiers get unlimited blurred analyses
  };
  aiCoach: {
    access: boolean;
    messageLimit: number | 'unlimited'; // 0 for free, unlimited for premium
  };
  routines: {
    customCount: number | 'unlimited'; // 1 for free (template), unlimited for premium
    aiOptimization: boolean;
  };
  challenges: {
    access: 'locked' | 'basic' | 'all';
    exclusive: boolean;
  };
  aiTransform: {
    access: boolean;
  };
  progressTracking: {
    access: 'limited' | 'full' | 'full_plus_insights';
  };
  leaderboard: {
    access: 'view_only' | 'full' | 'priority';
  };
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  unblurCredits: number;
  features: FeatureAccess;
  isLoading: boolean;
  analysesUsedThisMonth: number;
  coachMessagesUsedThisMonth: number;
}

export const TIER_FEATURES: Record<SubscriptionTier, FeatureAccess> = {
  free: {
    analyses: {
      unblurredCount: 0,
      totalCount: 'unlimited',
    },
    aiCoach: {
      access: false,
      messageLimit: 0,
    },
    routines: {
      customCount: 1, // Basic template only
      aiOptimization: false,
    },
    challenges: {
      access: 'locked',
      exclusive: false,
    },
    aiTransform: {
      access: false,
    },
    progressTracking: {
      access: 'limited',
    },
    leaderboard: {
      access: 'view_only',
    },
  },
  premium: {
    analyses: {
      unblurredCount: 30,
      totalCount: 'unlimited',
    },
    aiCoach: {
      access: true,
      messageLimit: 'unlimited',
    },
    routines: {
      customCount: 'unlimited',
      aiOptimization: true,
    },
    challenges: {
      access: 'all',
      exclusive: true,
    },
    aiTransform: {
      access: true,
    },
    progressTracking: {
      access: 'full_plus_insights',
    },
    leaderboard: {
      access: 'priority',
    },
  },
};
