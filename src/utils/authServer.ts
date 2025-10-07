import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseServer } from "@/lib/supabase-server";
import { RefreshTokenManager } from "@/utils/refreshTokenManager";
// Custom auth error classes
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class RefreshTokenExpiredError extends AuthError {
  constructor(message: string = 'Refresh token has expired') {
    super(message);
    this.name = 'RefreshTokenExpiredError';
  }
}

export class RefreshTokenAlreadyUsedError extends AuthError {
  constructor(message: string = 'Refresh token has already been used') {
    super(message);
    this.name = 'RefreshTokenAlreadyUsedError';
  }
}

export async function getSupabaseUserFromRequest(request: NextRequest) {
  try {
    console.log('🔍 Getting user from request...');
    
    // Use the proper route handler client with cookie access
    const supabase = createRouteHandlerClient({ cookies });
    
    // Try to get user with automatic token refresh handling
    const { data: { user }, error } = await RefreshTokenManager.getInstance().withTokenRefresh(
      () => supabase.auth.getUser()
    );
    
    if (error) {
      console.error('❌ Error getting user from session:', error.message);
      
      // Handle specific refresh token errors
      if (error.message?.includes('refresh_token') || 
          error.message?.includes('Invalid Refresh Token') ||
          error.message?.includes('Already Used')) {
        console.warn('🔄 Refresh token issue detected, clearing auth state');
        await RefreshTokenManager.getInstance().clearAuthState();
        return null;
      }
      
      return null;
    }
    
    if (!user) {
      console.log('❌ No user found in session');
      return null;
    }
    
    console.log('✅ User authenticated:', user.id);
    return user;
  } catch (error: any) {
    console.error('❌ Unexpected error in getSupabaseUserFromRequest:', error);
    
    // Handle refresh token errors at the catch level too
    if (error instanceof RefreshTokenAlreadyUsedError || 
        error instanceof RefreshTokenExpiredError) {
      console.warn('🔄 Clearing auth state due to refresh token error');
      await RefreshTokenManager.getInstance().clearAuthState();
    }
    
    return null;
  }
}

export async function requireAuth(request: NextRequest) {
  try {
    const user = await getSupabaseUserFromRequest(request);
    
    if (!user) {
      throw new AuthError("Unauthorized");
    }
    
    return user;
  } catch (error: any) {
    // Enhanced error handling for require auth
    if (error instanceof RefreshTokenAlreadyUsedError || 
        error instanceof RefreshTokenExpiredError) {
      throw new AuthError("Session expired");
    }
    
    throw error;
  }
}

export async function requireAdminAuth(request: NextRequest) {
  const user = await requireAuth(request);
  
  // Check admin status from profiles table first, then fallback to metadata
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('profiles')
      .select('role, is_admin')
      .eq('id', user.id)
      .maybeSingle();
    
    if (!error && data) {
      if (data.is_admin === true || data.role === 'admin') {
        return user;
      }
    }
  } catch (error) {
    console.warn('Could not fetch profile for admin check:', error);
  }
  
  // Fallback to user metadata
  if (user.user_metadata?.role === 'admin') {
    return user;
  }
  
  throw new AuthError("Admin access required");
}

/**
 * Helper function to create standardized auth error responses
 */
export function createAuthErrorResponse(error: any, request?: NextRequest) {
  const isApiRoute = request?.nextUrl.pathname.startsWith('/api/');
  
  if (error instanceof RefreshTokenAlreadyUsedError || 
      error instanceof RefreshTokenExpiredError) {
    
    if (isApiRoute) {
      return Response.json(
        { 
          error: 'Session expired', 
          code: 'SESSION_EXPIRED',
          message: 'Please sign in again' 
        },
        { status: 401 }
      );
    }
    
    // For non-API routes, return redirect response
    const signInUrl = new URL('/auth/signin', request?.url || 'http://localhost:3000');
    signInUrl.searchParams.set('error', 'session_expired');
    return Response.redirect(signInUrl);
  }
  
  // Generic auth error
  if (isApiRoute) {
    return Response.json(
      { error: 'Unauthorized', message: error.message },
      { status: 401 }
    );
  }
  
  const signInUrl = new URL('/auth/signin', request?.url || 'http://localhost:3000');
  return Response.redirect(signInUrl);
}
