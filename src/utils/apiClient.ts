/**
 * Utility for making authenticated API calls to Supabase-backed endpoints
 */

interface ApiCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export async function authenticatedApiCall(
  endpoint: string, 
  options: ApiCallOptions = {}
) {
  const { method = 'GET', body, headers = {} } = options;

  try {
    console.log(`🔄 Making ${method} request to ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method,
      credentials: 'include', // Always include cookies for Supabase auth
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ API Error (${response.status}):`, errorData);
      
      throw new Error(
        errorData.error || 
        `Request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    console.log(`✅ ${method} ${endpoint} successful`);
    
    return data;
  } catch (error) {
    console.error(`❌ API call failed:`, error);
    throw error;
  }
}

// Specific functions for common operations
export const favoriteApi = {
  getFavorites: () => authenticatedApiCall('/api/events/favorite'),
  
  toggleFavorite: (eventId: string) => 
    authenticatedApiCall('/api/events/favorite', {
      method: 'POST',
      body: { eventId }
    }),

  checkFavoriteStatus: (eventId: string) =>
    authenticatedApiCall(`/api/events/favorite/${eventId}`),
};

export const eventApi = {
  getEvents: (params: { q?: string; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    
    const query = searchParams.toString();
    return authenticatedApiCall(`/api/events${query ? `?${query}` : ''}`);
  },
};
