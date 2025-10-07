import { SupabaseClient } from '@supabase/supabase-js';

export interface RefreshTokenRequest {
  id: string;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export interface RefreshTokenResult {
  success: boolean;
  session?: any;
  error?: Error;
}

/**
 * Singleton class to manage refresh token operations and prevent race conditions
 */
export class RefreshTokenManager {
  private static instance: RefreshTokenManager;
  private refreshPromise: Promise<RefreshTokenResult> | null = null;
  private refreshQueue: RefreshTokenRequest[] = [];
  private isRefreshing = false;
  private lastRefreshTime = 0;
  private readonly REFRESH_COOLDOWN = 5000; // 5 seconds cooldown between refreshes
  private readonly MAX_QUEUE_SIZE = 10;
  private readonly REFRESH_TIMEOUT = 30000; // 30 seconds timeout

  private constructor() {}

  public static getInstance(): RefreshTokenManager {
    if (!RefreshTokenManager.instance) {
      RefreshTokenManager.instance = new RefreshTokenManager();
    }
    return RefreshTokenManager.instance;
  }

  /**
   * Wraps any Supabase operation with automatic token refresh handling
   */
  public async withTokenRefresh<T>(
    operation: () => Promise<T>,
    supabaseClient?: SupabaseClient
  ): Promise<T> {
    try {
      const result = await operation();
      return result;
    } catch (error: any) {
      // Check if this is a token-related error
      if (this.isTokenError(error)) {
        console.log('🔄 Token error detected, attempting refresh...');
        
        if (supabaseClient) {
          const refreshResult = await this.refreshTokenSafely(supabaseClient);
          if (refreshResult.success) {
            // Retry the operation with refreshed token
            return await operation();
          }
        }
        
        // If refresh failed or no client provided, clear auth state
        await this.clearAuthState();
        throw error;
      }
      
      throw error;
    }
  }

  /**
   * Safely refresh tokens with mutex/locking to prevent race conditions
   */
  public async refreshTokenSafely(supabaseClient: SupabaseClient): Promise<RefreshTokenResult> {
    const now = Date.now();
    
    // Check cooldown period
    if (now - this.lastRefreshTime < this.REFRESH_COOLDOWN) {
      console.log('🚫 Refresh cooldown active, skipping refresh');
      return { success: false, error: new Error('Refresh cooldown active') };
    }

    // If already refreshing, queue this request
    if (this.isRefreshing && this.refreshPromise) {
      return await this.queueRefreshRequest();
    }

    // Start the refresh process
    this.isRefreshing = true;
    this.lastRefreshTime = now;

    this.refreshPromise = this.performRefresh(supabaseClient);
    
    try {
      const result = await this.refreshPromise;
      
      // Process queued requests
      this.processQueue(result);
      
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Queue a refresh request when another refresh is in progress
   */
  private async queueRefreshRequest(): Promise<RefreshTokenResult> {
    if (this.refreshQueue.length >= this.MAX_QUEUE_SIZE) {
      throw new Error('Refresh queue is full');
    }

    return new Promise((resolve, reject) => {
      const request: RefreshTokenRequest = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        resolve,
        reject
      };

      this.refreshQueue.push(request);

      // Set timeout for queued request
      setTimeout(() => {
        const index = this.refreshQueue.findIndex(r => r.id === request.id);
        if (index >= 0) {
          this.refreshQueue.splice(index, 1);
          reject(new Error('Refresh request timeout'));
        }
      }, this.REFRESH_TIMEOUT);
    });
  }

  /**
   * Process all queued refresh requests
   */
  private processQueue(result: RefreshTokenResult): void {
    const queue = [...this.refreshQueue];
    this.refreshQueue = [];

    queue.forEach(request => {
      if (result.success) {
        request.resolve(result);
      } else {
        request.reject(result.error || new Error('Token refresh failed'));
      }
    });
  }

  /**
   * Perform the actual token refresh
   */
  private async performRefresh(supabaseClient: SupabaseClient): Promise<RefreshTokenResult> {
    try {
      console.log('🔄 Performing token refresh...');
      
      const { data, error } = await supabaseClient.auth.refreshSession();
      
      if (error) {
        console.error('❌ Token refresh failed:', error.message);
        
        // Handle specific refresh token errors
        if (this.isRefreshTokenError(error)) {
          await this.clearAuthState();
          return { 
            success: false, 
            error: new Error(`Refresh token error: ${error.message}`) 
          };
        }
        
        return { success: false, error };
      }
      
      if (!data.session) {
        console.error('❌ No session returned from refresh');
        await this.clearAuthState();
        return { success: false, error: new Error('No session returned') };
      }
      
      console.log('✅ Token refresh successful');
      return { success: true, session: data.session };
      
    } catch (error: any) {
      console.error('❌ Unexpected error during token refresh:', error);
      
      if (this.isTokenError(error)) {
        await this.clearAuthState();
      }
      
      return { success: false, error };
    }
  }

  /**
   * Check if an error is token-related
   */
  private isTokenError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';
    
    return (
      message.includes('refresh_token') ||
      message.includes('invalid refresh token') ||
      message.includes('already used') ||
      message.includes('token expired') ||
      message.includes('jwt expired') ||
      message.includes('unauthorized') ||
      code === 'invalid_grant' ||
      code === 'token_expired' ||
      error.status === 401
    );
  }

  /**
   * Check if an error is specifically about refresh token issues
   */
  private isRefreshTokenError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    
    return (
      message.includes('refresh_token') ||
      message.includes('invalid refresh token') ||
      message.includes('already used') ||
      message.includes('refresh token expired')
    );
  }

  /**
   * Clear auth state from all storage locations
   */
  public async clearAuthState(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      console.log('🧹 Clearing auth state...');
      
      // Clear localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Clear specific known keys
      const authKeys = [
        'supabase.auth.token',
        'sb-auth-token',
        'sb-refresh-token',
        'supabase.session',
        'auth.session'
      ];
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      console.log('✅ Auth state cleared');
    } catch (error) {
      console.error('❌ Error clearing auth state:', error);
    }
  }

  /**
   * Get current refresh status
   */
  public getRefreshStatus() {
    return {
      isRefreshing: this.isRefreshing,
      queueLength: this.refreshQueue.length,
      lastRefreshTime: this.lastRefreshTime,
      cooldownRemaining: Math.max(0, this.REFRESH_COOLDOWN - (Date.now() - this.lastRefreshTime))
    };
  }

  /**
   * Force clear all queued requests (useful for cleanup)
   */
  public clearQueue(): void {
    const queue = [...this.refreshQueue];
    this.refreshQueue = [];
    
    queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
  }

  /**
   * Reset the manager state (useful for testing or logout)
   */
  public reset(): void {
    this.clearQueue();
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.lastRefreshTime = 0;
  }
}
