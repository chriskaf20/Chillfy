import { useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { RefreshTokenManager } from '@/utils/refreshTokenManager';

export interface ApiCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Custom hook for making authenticated API calls with automatic token refresh and retry logic
 */
export function useApiCall() {
  const [loading, setLoading] = useState(false);
  const supabase = getSupabaseClient();

  const apiCall = useCallback(async <T = any>(
    endpoint: string,
    options: ApiCallOptions = {}
  ): Promise<ApiResponse<T>> => {
    const {
      method = 'GET',
      body,
      headers = {},
      retries = 2,
      retryDelay = 1000
    } = options;

    setLoading(true);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          
          // Try to refresh the session
          const refreshResult = await RefreshTokenManager.getInstance().refreshTokenSafely(supabase);
          
          if (!refreshResult.success) {
            await RefreshTokenManager.getInstance().clearAuthState();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/signin?error=session_expired';
            }
            return { error: 'Session expired', status: 401 };
          }
        }

        // Prepare headers
        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...headers
        };

        // Add authorization header if session exists
        if (session?.access_token) {
          requestHeaders.Authorization = `Bearer ${session.access_token}`;
        }

        // Prepare request body
        const requestBody = body ? JSON.stringify(body) : undefined;

        // Make the API call
        const response = await fetch(endpoint, {
          method,
          headers: requestHeaders,
          body: requestBody,
        });

        // Handle response
        if (response.ok) {
          const data = await response.json();
          setLoading(false);
          return { data, status: response.status };
        }

        // Handle error responses
        const errorData = await response.json().catch(() => ({}));
        
        // Check for authentication errors
        if (response.status === 401) {
          console.warn('🔄 401 error, attempting token refresh...');
          
          // Try to refresh token
          const refreshResult = await RefreshTokenManager.getInstance().refreshTokenSafely(supabase);
          
          if (refreshResult.success && attempt < retries) {
            // Retry with refreshed token
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          } else {
            // Refresh failed, clear auth state and redirect
            await RefreshTokenManager.getInstance().clearAuthState();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/signin?error=session_expired';
            }
            setLoading(false);
            return { 
              error: errorData.message || 'Authentication required', 
              status: response.status 
            };
          }
        }

        // Handle other error statuses
        if (response.status >= 500 && attempt < retries) {
          // Retry on server errors
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        setLoading(false);
        return { 
          error: errorData.message || `Request failed with status ${response.status}`, 
          status: response.status 
        };

      } catch (error: any) {
        console.error(`API call attempt ${attempt + 1} failed:`, error);

        // Check if it's a token-related error
        if (error.message?.includes('refresh_token') || 
            error.message?.includes('Invalid Refresh Token') ||
            error.message?.includes('Already Used')) {
          
          await RefreshTokenManager.getInstance().clearAuthState();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/signin?error=session_expired';
          }
          setLoading(false);
          return { error: 'Session expired', status: 401 };
        }

        // Retry on network errors
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        setLoading(false);
        return { error: error.message || 'Network error', status: 500 };
      }
    }

    setLoading(false);
    return { error: 'Max retries exceeded', status: 500 };
  }, [supabase]);

  return { apiCall, loading };
}

/**
 * Convenience hooks for specific HTTP methods
 */
export function useGet() {
  const { apiCall, loading } = useApiCall();
  
  const get = useCallback(async <T = any>(endpoint: string, headers?: Record<string, string>) => {
    return await apiCall<T>(endpoint, { method: 'GET', headers });
  }, [apiCall]);

  return { get, loading };
}

export function usePost() {
  const { apiCall, loading } = useApiCall();
  
  const post = useCallback(async <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) => {
    return await apiCall<T>(endpoint, { method: 'POST', body, headers });
  }, [apiCall]);

  return { post, loading };
}

export function usePut() {
  const { apiCall, loading } = useApiCall();
  
  const put = useCallback(async <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) => {
    return await apiCall<T>(endpoint, { method: 'PUT', body, headers });
  }, [apiCall]);

  return { put, loading };
}

export function useDelete() {
  const { apiCall, loading } = useApiCall();
  
  const del = useCallback(async <T = any>(endpoint: string, headers?: Record<string, string>) => {
    return await apiCall<T>(endpoint, { method: 'DELETE', headers });
  }, [apiCall]);

  return { delete: del, loading };
}
