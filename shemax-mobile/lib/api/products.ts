import { apiGet, apiPost } from './client';
import { Product, RecommendedProduct } from '../types';

interface GetProductsParams {
  category?: string;
  recommended_for?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}

interface GetProductsResponse {
  products: Product[];
  total: number;
}

export const getProducts = async (
  params: GetProductsParams = {},
  token?: string
): Promise<GetProductsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.category) queryParams.append('category', params.category);
  if (params.recommended_for) queryParams.append('recommended_for', params.recommended_for);
  if (params.featured) queryParams.append('featured', 'true');
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());
  // Note: The backend API (GET /api/products) doesn't seem to support search query yet based on route.ts, 
  // but we'll include it in case it's added or handled on frontend filtering for now.
  // Re-checking route.ts: it only checks category, recommended_for, featured.
  
  const queryString = queryParams.toString();
  const endpoint = `/api/products${queryString ? `?${queryString}` : ''}`;
  
  return apiGet<GetProductsResponse>(endpoint, token);
};

export const trackProductClick = async (
  productId: string,
  token?: string
): Promise<void> => {
  await apiPost(`/api/products/click`, { productId }, token);
};

interface GetRecommendationsResponse {
  recommendations: RecommendedProduct[];
}

export const getPersonalizedRecommendations = async (
  analysisId: string,
  token?: string
): Promise<RecommendedProduct[]> => {
  const response = await apiPost<GetRecommendationsResponse>(
    '/api/products/recommend',
    { analysisId },
    token
  );
  return response.recommendations;
};

