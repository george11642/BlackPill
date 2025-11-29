import { apiGet } from './client';
import { Analysis } from '../types';

export const getLatestAnalysis = async (token?: string): Promise<Analysis | null> => {
  try {
    const response = await apiGet<{ analyses: Analysis[] }>(
      '/api/analyses/history?limit=1',
      token
    );
    return response.analyses?.[0] || null;
  } catch (error) {
    console.error('Failed to fetch latest analysis:', error);
    return null;
  }
};

