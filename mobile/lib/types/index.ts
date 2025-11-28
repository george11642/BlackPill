// Common types used across the app

export interface Analysis {
  id: string;
  userId: string;
  photoUrl: string;
  score: number;
  dimensions: {
    facialSymmetry: number;
    skinQuality: number;
    facialStructure: number;
    eyeArea: number;
    noseArea: number;
    mouthArea: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  description: string;
  tasks: RoutineTask[];
  schedule: RoutineSchedule;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineTask {
  id: string;
  routineId: string;
  name: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  tier?: 'DIY' | 'OTC' | 'Professional';
  estimatedCost?: string; // e.g., "$0-30", "$50-150"
  timeToResults?: string; // e.g., "4-8 weeks", "2-6 months"
  effectiveness?: 'low' | 'medium' | 'high' | 'very high';
  scienceBacking?: string; // Why this works scientifically
  productLink?: string; // For OTC tasks - links to marketplace
  professionalWarning?: string; // For Professional tier - safety warnings
}

export interface RoutineSchedule {
  frequency: 'daily' | 'weekly' | 'custom';
  daysOfWeek?: number[];
  timeOfDay?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  duration: number; // days
  startDate: string;
  endDate: string;
  participants: number;
  joined: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  avatarUrl?: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: string;
  planId: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price?: number;
  currency: string;
  affiliate_link: string;
  image_url?: string;
  rating?: number;
  review_count: number;
  recommended_for?: string[];
  is_featured: boolean;
}
