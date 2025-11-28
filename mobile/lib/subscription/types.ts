export type SubscriptionTier = 'free' | 'pro' | 'elite';

export interface FeatureAccess {
  analyses: {
    unblurredCount: number; // 0 for free (unless credits used), 10 for pro, 30 for elite
    totalCount: 'unlimited'; // All tiers get unlimited blurred analyses
  };
  aiCoach: {
    access: boolean;
    messageLimit: number | 'unlimited'; // 0 for free, 20 for pro, 100 for elite
  };
  routines: {
    customCount: number | 'unlimited'; // 1 for free (template), 5 for pro, 25 for elite
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
  pro: {
    analyses: {
      unblurredCount: 10,
      totalCount: 'unlimited',
    },
    aiCoach: {
      access: true,
      messageLimit: 20,
    },
    routines: {
      customCount: 5,
      aiOptimization: false,
    },
    challenges: {
      access: 'basic',
      exclusive: false,
    },
    aiTransform: {
      access: false,
    },
    progressTracking: {
      access: 'full',
    },
    leaderboard: {
      access: 'full',
    },
  },
  elite: {
    analyses: {
      unblurredCount: 30,
      totalCount: 'unlimited',
    },
    aiCoach: {
      access: true,
      messageLimit: 100, // Reasonable limit: 100 messages/month
    },
    routines: {
      customCount: 25, // Reasonable limit: 25 active routines
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

