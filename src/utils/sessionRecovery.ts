import { getSupabaseClient } from '@/lib/supabase';
import { RefreshTokenManager } from './refreshTokenManager';

export interface SessionRecoveryOptions {
  redirectOnFailure?: boolean;
  clearOnExpiry?: boolean;
  maxRetries?: number;
}

export interface SessionStatus {
  isValid: boolean;
  needsRefresh: boolean;
  expiresAt?: number;
  error?: string;
}

/**
 * Utility class for session recovery and management
 */
export class SessionRecovery {
  private static instance: SessionRecovery;
  private supabase = getSupabaseClient();
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): SessionRecovery {
    if (!SessionRecovery.instance) {
      SessionRecovery.instance = new SessionRecovery();
    }
    return SessionRecovery.instance;
  }

  /**
   * Check the current session status
   */
  public async checkSessionStatus(): Promise<SessionStatus> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error) {
        console.error('Session check error:', error);
        return {
          isValid: false,
          needsRefresh: this.isRefreshableError(error),
          error: error.message
        };
      }

      if (!session) {
        return {
          isValid: false,
          needsRefresh: false,
          error: 'No session found'
        };
      }

      // Check if session is expired or will expire soon
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;

      // Session needs refresh if it expires in less than 5 minutes
      const needsRefresh = timeUntilExpiry < 300;

      return {
        isValid: timeUntilExpiry > 0,
        needsRefresh,
        expiresAt: session.expires_at,
        error: timeUntilExpiry <= 0 ? 'Session expired' : undefined
      };

    } catch (error: any) {
      console.error('Unexpected error checking session:', error);
      return {
        isValid: false,
        needsRefresh: this.isRefreshableError(error),
        error: error.message
      };
    }
  }

  /**
   * Attempt to recover the session
   */
  public async recoverSession(options: SessionRecoveryOptions = {}): Promise<boolean> {
    const {
      redirectOnFailure = true,
      clearOnExpiry = true,
      maxRetries = 3
    } = options;

    console.log('🔄 Attempting session recovery...');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const status = await this.checkSessionStatus();

        if (status.isValid && !status.needsRefresh) {
          console.log('✅ Session is valid, no recovery needed');
          return true;
        }

        if (!status.needsRefresh) {
          console.log('❌ Session cannot be recovered');
          if (clearOnExpiry) {
            await this.clearInvalidSession();
          }
          if (redirectOnFailure) {
            this.redirectToSignIn('Session expired');
          }
          return false;
        }

        // Attempt to refresh the session
        console.log(`🔄 Refreshing session (attempt ${attempt}/${maxRetries})...`);
        const refreshResult = await RefreshTokenManager.getInstance().refreshTokenSafely(this.supabase);

        if (refreshResult.success) {
          console.log('✅ Session recovered successfully');
          return true;
        }

        console.warn(`❌ Session refresh failed (attempt ${attempt}/${maxRetries}):`, refreshResult.error?.message);

        // Wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

      } catch (error: any) {
        console.error(`Session recovery attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          break;
        }
      }
    }

    // All recovery attempts failed
    console.error('❌ Session recovery failed after all attempts');
    
    if (clearOnExpiry) {
      await this.clearInvalidSession();
    }
    
    if (redirectOnFailure) {
      this.redirectToSignIn('Session recovery failed');
    }

    return false;
  }

  /**
   * Start automatic session monitoring
   */
  public startSessionMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.stopSessionMonitoring(); // Clear any existing interval

    this.intervalId = setInterval(async () => {
      const status = await this.checkSessionStatus();
      
      if (!status.isValid) {
        console.warn('🔔 Session monitor detected invalid session');
        await this.recoverSession({ redirectOnFailure: false });
      } else if (status.needsRefresh) {
        console.log('🔔 Session monitor triggering proactive refresh');
        await RefreshTokenManager.getInstance().refreshTokenSafely(this.supabase);
      }
    }, this.CHECK_INTERVAL);

    console.log('🔔 Session monitoring started');
  }

  /**
   * Stop automatic session monitoring
   */
  public stopSessionMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🔔 Session monitoring stopped');
    }
  }

  /**
   * Clear invalid session data
   */
  private async clearInvalidSession(): Promise<void> {
    try {
      console.log('🧹 Clearing invalid session...');
      
      // Sign out from Supabase (this should clear session)
      await this.supabase.auth.signOut();
      
      // Clear auth state using RefreshTokenManager
      await RefreshTokenManager.getInstance().clearAuthState();
      
      console.log('✅ Invalid session cleared');
    } catch (error) {
      console.error('Error clearing invalid session:', error);
    }
  }

  /**
   * Check if an error is recoverable through token refresh
   */
  private isRefreshableError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    
    // Don't try to refresh if the refresh token itself is the problem
    if (message.includes('refresh_token') && 
        (message.includes('already used') || message.includes('invalid'))) {
      return false;
    }
    
    return (
      message.includes('jwt expired') ||
      message.includes('token expired') ||
      message.includes('unauthorized') ||
      error.status === 401
    );
  }

  /**
   * Redirect to sign in page with error message
   */
  private redirectToSignIn(reason: string): void {
    if (typeof window === 'undefined') return;
    
    const currentPath = window.location.pathname;
    const signInUrl = new URL('/auth/signin', window.location.origin);
    signInUrl.searchParams.set('error', 'session_expired');
    signInUrl.searchParams.set('message', reason);
    signInUrl.searchParams.set('callbackUrl', currentPath);
    
    console.log(`🔄 Redirecting to sign in: ${reason}`);
    window.location.href = signInUrl.toString();
  }

  /**
   * Manually trigger session cleanup
   */
  public async cleanup(): Promise<void> {
    this.stopSessionMonitoring();
    await this.clearInvalidSession();
    RefreshTokenManager.getInstance().reset();
  }

  /**
   * Get session expiry information
   */
  public async getSessionExpiry(): Promise<{ expiresAt?: number; timeUntilExpiry?: number; expired: boolean }> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session) {
        return { expired: true };
      }
      
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;
      
      return {
        expiresAt: session.expires_at,
        timeUntilExpiry: Math.max(0, timeUntilExpiry),
        expired: timeUntilExpiry <= 0
      };
    } catch (error) {
      console.error('Error getting session expiry:', error);
      return { expired: true };
    }
  }
}

/**
 * React hook for session recovery
 */
export function useSessionRecovery() {
  const sessionRecovery = SessionRecovery.getInstance();

  const checkSession = async () => {
    return await sessionRecovery.checkSessionStatus();
  };

  const recoverSession = async (options?: SessionRecoveryOptions) => {
    return await sessionRecovery.recoverSession(options);
  };

  const startMonitoring = () => {
    sessionRecovery.startSessionMonitoring();
  };

  const stopMonitoring = () => {
    sessionRecovery.stopSessionMonitoring();
  };

  const cleanup = async () => {
    await sessionRecovery.cleanup();
  };

  const getExpiry = async () => {
    return await sessionRecovery.getSessionExpiry();
  };

  return {
    checkSession,
    recoverSession,
    startMonitoring,
    stopMonitoring,
    cleanup,
    getExpiry
  };
}
