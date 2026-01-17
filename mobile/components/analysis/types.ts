import { NavigationProp } from '@react-navigation/native';

// Feature analysis with score and description
export interface FeatureAnalysis {
  score: number;
  description: string;
  improvement?: string;
}

// API response shape - supports both old (number) and new (object) formats
export interface AnalysisResponse {
  id: string;
  user_id: string;
  image_url: string;
  score: number;
  potential_score?: number;
  is_public?: boolean;
  breakdown: {
    masculinity?: FeatureAnalysis | number;
    femininity?: FeatureAnalysis | number;
    skin: FeatureAnalysis | number;
    jawline: FeatureAnalysis | number;
    cheekbones?: FeatureAnalysis | number;
    eyes: FeatureAnalysis | number;
    symmetry: FeatureAnalysis | number;
    lips: FeatureAnalysis | number;
    hair: FeatureAnalysis | number;
    bone_structure?: FeatureAnalysis | number; // Legacy field
  };
  tips: Array<{
    title: string;
    description: string;
    timeframe: string;
  }>;
  created_at: string;
}

export interface MetricData {
  label: string;
  value: number;
  key: string;
  description: string;
  improvement?: string;
}

export interface RoutineSuggestion {
  id: string;
  name: string;
  description: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

// Common props shared by all page components
export interface AnalysisPageProps {
  analysis: AnalysisResponse;
  metrics: MetricData[];
  strengths: MetricData[];
  weaknesses: MetricData[];
  previousAnalysis?: AnalysisResponse | null;
  routineSuggestion?: RoutineSuggestion | null;
  navigation: NavigationProp<any>;
  isUnblurred: boolean;
  isActive: boolean;
}

// Helper to extract score from either format
export function getFeatureScore(feature: FeatureAnalysis | number | undefined): number {
  if (feature === undefined) return 5.0;
  if (typeof feature === 'number') return feature;
  return feature.score;
}

// Helper to extract description from either format
export function getFeatureDescription(feature: FeatureAnalysis | number | undefined, fallback: string): string {
  if (feature === undefined) return fallback;
  if (typeof feature === 'number') return fallback;
  return feature.description || fallback;
}

// Helper to extract improvement tip from either format
export function getFeatureImprovement(feature: FeatureAnalysis | number | undefined): string | undefined {
  if (feature === undefined) return undefined;
  if (typeof feature === 'number') return undefined;
  return feature.improvement;
}

// Rating category based on score (neutral, self-improvement focused)
export function getRatingCategory(score: number): string {
  if (score >= 9.5) return 'Elite';
  if (score >= 8) return 'Excellent';
  if (score >= 7) return 'Above Average';
  if (score >= 5.5) return 'Average';
  if (score >= 4.5) return 'Developing';
  if (score >= 3) return 'Foundation';
  return 'Starting';
}

// Category color based on score
export function getCategoryColor(score: number): string {
  if (score >= 9.5) return '#AA44FF'; // Elite - Purple
  if (score >= 8) return '#44AAFF';   // Excellent - Blue
  if (score >= 7) return '#44CC88';   // Above Average - Teal
  if (score >= 5.5) return '#88CC44'; // Average - Green
  if (score >= 4.5) return '#FFAA44'; // Developing - Orange
  if (score >= 3) return '#FF8844';   // Foundation - Light Orange
  return '#FF4444';                   // Starting - Red
}
