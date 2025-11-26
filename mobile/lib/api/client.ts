import Constants from 'expo-constants';

const APP_URL = Constants.expoConfig?.extra?.appUrl || process.env.EXPO_PUBLIC_APP_URL || 'https://black-pill.app';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${APP_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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
  return request<T>(endpoint, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiPost<T>(
  endpoint: string,
  data?: any,
  token?: string
): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiPut<T>(
  endpoint: string,
  data?: any,
  token?: string
): Promise<T> {
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
  return request<T>(endpoint, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

