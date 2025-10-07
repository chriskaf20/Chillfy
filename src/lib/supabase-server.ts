// Server-only helpers for Supabase (safe to import next/headers)
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient as createAuthServerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Server-side (use service role when needed)
export const supabaseServer = () => {
  if (!service) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, service);
};

// Enhanced server client creation with error handling
export const createSupabaseServerClientFromRequest = (request?: NextRequest) => {
  try {
    console.log('🔍 Creating Supabase server client...');
    
    // Use cookies() for App Router compatibility
    const cookieStore = cookies();
    
    // Create client with better error handling for cookie parsing
    const supabase = createAuthServerClient({ 
      cookies: () => cookieStore
    });

    return { supabase };
  } catch (error) {
    console.error('❌ Error creating Supabase server client:', error);
    
    // Fallback: Create a client without cookie handling for now
    console.log('🔄 Creating fallback Supabase client...');
    const fallbackSupabase = createClient(url, anon);
    return { supabase: fallbackSupabase };
  }
};

// Helper to handle auth errors and return appropriate responses
export const handleAuthError = (error: any, request?: NextRequest): NextResponse | null => {
  const message = error?.message?.toLowerCase() || '';
  
  // Check for refresh token errors
  if (
    message.includes('refresh_token') ||
    message.includes('invalid refresh token') ||
    message.includes('already used') ||
    message.includes('token expired')
  ) {
    console.warn('🔄 Refresh token error detected on server:', error.message);
    
    // If this is an API request, return 401
    if (request?.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          code: 'REFRESH_TOKEN_ERROR',
          message: 'Session expired, please sign in again'
        },
        { status: 401 }
      );
    }
    
    // For non-API requests, redirect to sign in
    const signInUrl = new URL('/auth/signin', request?.url || 'http://localhost:3000');
    signInUrl.searchParams.set('error', 'session_expired');
    signInUrl.searchParams.set('message', 'Your session has expired. Please sign in again.');
    
    return NextResponse.redirect(signInUrl);
  }
  
  return null;
};

// Wrapper for server operations that need auth with error handling
export const withServerAuth = async <T>(
  operation: (supabase: any) => Promise<T>,
  request?: NextRequest
): Promise<T> => {
  try {
    const { supabase } = createSupabaseServerClientFromRequest(request);
    return await operation(supabase);
  } catch (error: any) {
    const errorResponse = handleAuthError(error, request);
    if (errorResponse) {
      throw error; // Let the calling code handle the response
    }
    throw error;
  }
};
