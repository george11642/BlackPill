import { getApiUrl } from '../utils/apiUrl';

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
  const apiUrl = getApiUrl();
  const url = `${apiUrl}${endpoint}`;
  
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

export async function apiPatch<T>(
  endpoint: string,
  data?: any,
  token?: string
): Promise<T> {
  return request<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

