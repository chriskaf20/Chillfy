import { RefreshTokenManager } from "@/utils/refreshTokenManager";

// Enhanced error types for better error handling
export class AuthError extends Error {
  public code?: string;
  public status?: number;
  public cause?: Error;

  constructor(message: string, options?: { code?: string; status?: number; cause?: Error }) {
    super(message);
    this.name = "AuthError";
    this.code = options?.code;
    this.status = options?.status;
    this.cause = options?.cause;
  }
}

export class RefreshTokenExpiredError extends Error {
  constructor(message = "Refresh token has expired or is invalid") {
    super(message);
    this.name = "RefreshTokenExpiredError";
  }
}

export class RefreshTokenAlreadyUsedError extends Error {
  constructor(message = "Refresh token has already been used") {
    super(message);
    this.name = "RefreshTokenAlreadyUsedError";
  }
}

export class SignInTimeoutError extends Error {
  constructor(message = "Sign-in operation timed out") {
    super(message);
    this.name = "SignInTimeoutError";
  }
}

export class AuthStateCorruptedError extends Error {
  constructor(message = "Authentication state is corrupted") {
    super(message);
    this.name = "AuthStateCorruptedError";
  }
}

/**
 * Enhanced force clear auth state function with better cleanup
 */
export async function forceClearAuthState(): Promise<void> {
  if (typeof window === 'undefined') {
    console.warn('⚠️ [Auth] forceClearAuthState called on server side');
    return;
  }

  console.log('🧹 [Auth] Force clearing ALL authentication state...');
  
  try {
    // 1. Clear Supabase client session first
    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();
      await Promise.race([
        supabase.auth.signOut({ scope: 'global' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Signout timeout')), 3000))
      ]);
      console.log('✅ [Auth] Supabase signout completed');
    } catch (e) {
      console.warn('⚠️ [Auth] Supabase signout warning (continuing):', e);
    }

    // 2. Clear all localStorage auth data
    const localKeys = Object.keys(localStorage);
    localKeys.forEach(key => {
      if (key.includes('supabase') || 
          key.includes('auth') || 
          key.includes('sb-') ||
          key.includes('nextauth') ||
          key.includes('session') ||
          key.includes('token') ||
          key.includes('refresh')) {
        localStorage.removeItem(key);
        console.log(`🗑️ [Auth] Removed localStorage key: ${key}`);
      }
    });

    // 3. Clear all sessionStorage auth data
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.includes('supabase') || 
          key.includes('auth') || 
          key.includes('sb-') ||
          key.includes('nextauth') ||
          key.includes('session') ||
          key.includes('token') ||
          key.includes('refresh')) {
        sessionStorage.removeItem(key);
        console.log(`🗑️ [Auth] Removed sessionStorage key: ${key}`);
      }
    });

    // 4. Clear specific known auth keys
    const authKeys = [
      'supabase.auth.token',
      'sb-auth-token',
      'sb-refresh-token',
      'supabase.session',
      'auth.session',
      'nextauth.message',
      'next-auth.session-token',
      'next-auth.csrf-token',
      'auth-state',
      'user-session',
      'access_token',
      'refresh_token',
      'sb-access-token',
      'sb-refresh-token'
    ];
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // 5. Clear auth cookies with enhanced patterns
    const authCookies = document.cookie.split(';')
      .map(c => c.trim())
      .filter(c => c.includes('supabase') || 
                   c.includes('auth') || 
                   c.includes('sb-') ||
                   c.includes('session') ||
                   c.includes('token'));
    
    authCookies.forEach(cookie => {
      const name = cookie.split('=')[0];
      // Clear for multiple domains and paths
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname.split('.').slice(-2).join('.')};`;
      console.log(`🍪 [Auth] Cleared cookie: ${name}`);
    });

    // 6. Clear server-side session via API
    try {
      await Promise.race([
        fetch("/api/auth/clear-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Clear session timeout')), 3000))
      ]);
      console.log('✅ [Auth] Server session cleared');
    } catch (e) {
      console.warn('⚠️ [Auth] Server session clear warning (continuing):', e);
    }

    // 7. Reset auth managers
    RefreshTokenManager.getInstance().reset();
    
    console.log('✅ [Auth] Enhanced force clear auth state completed');
  } catch (error: any) {
    console.error('❌ [Auth] Error during force clear auth state:', error);
    throw new AuthStateCorruptedError(`Failed to clear auth state: ${error.message}`);
  }
}

/**
 * Enhanced timeout wrapper for auth operations with shorter defaults
 */
export async function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = 8000, // Reduced from 10s to 8s
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new SignInTimeoutError(`${timeoutMessage} after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Enhanced retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry,
    shouldRetry = (error) => {
      // Don't retry on authentication errors
      const message = error.message?.toLowerCase() || '';
      return !(
        message.includes('invalid login credentials') ||
        message.includes('email not confirmed') ||
        message.includes('too many requests') ||
        message.includes('unauthorized')
      );
    }
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [Auth] Retry attempt ${attempt} of ${maxRetries}`);
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`❌ [Auth] Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries || !shouldRetry(error)) {
        break;
      }
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      console.log(`⏳ [Auth] Waiting ${delay}ms before retry...`);
      
      if (onRetry) {
        onRetry(attempt, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
