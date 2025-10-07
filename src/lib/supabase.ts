// Client-only helper for Supabase public client
import { createClient } from '@supabase/supabase-js';
import { RefreshTokenManager } from '@/utils/refreshTokenManager';
// Note: server-only helpers live in ./supabase-server. Do NOT import or re-export them here.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate that required environment variables are present
if (!url || !anon) {
  console.error('❌ Missing required Supabase environment variables');
  console.error('Required variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing required Supabase environment variables');
  }
}

// Enhanced storage implementation that handles cleanup
class EnhancedSupabaseStorage {
  private storageKey: string;
  private storage: Storage;

  constructor(storageKey: string = 'supabase.auth.token') {
    this.storageKey = storageKey;
    this.storage = typeof window !== 'undefined' ? window.localStorage : {} as Storage;
  }

  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = this.storage.getItem(key);
      
      // Check if the stored session is valid
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed?.expires_at && parsed.expires_at < Date.now() / 1000) {
          console.log('🧹 Removing expired session from storage');
          await this.removeItem(key);
          return null;
        }
      }
      
      return item;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  }
}

// Client-side (public) with enhanced configuration for faster timeouts
export const supabaseClient = () => {
  // Return a mock client in development if environment variables are missing
  if (!url || !anon) {
    console.warn('⚠️ Supabase environment variables not found, returning mock client');
    return {
      auth: {
        onAuthStateChange: () => ({ data: { subscription: null } }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
      }),
    } as any;
  }

  const client = createClient(url, anon, { 
    auth: { 
      persistSession: true, 
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? new EnhancedSupabaseStorage() : undefined,
      storageKey: 'supabase.auth.token'
    },
    global: {
      headers: {
        'x-client-info': 'chillfy-web@1.0.0',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    }
  });

  // Add event listeners for auth state changes
  if (typeof window !== 'undefined') {
    client.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out, clearing auth state');
        await RefreshTokenManager.getInstance().clearAuthState();
      } else if (event === 'SIGNED_IN') {
        console.log('👋 User signed in');
        // Reset the refresh manager state on successful sign in
        RefreshTokenManager.getInstance().reset();
      }
    });
  }

  return client;
};

// Helper function to get client with error handling
export const getSupabaseClient = () => {
  try {
    return supabaseClient();
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
};

// Server-side helpers are in './supabase-server'
