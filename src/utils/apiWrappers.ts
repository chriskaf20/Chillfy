import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientFromRequest, handleAuthError } from '@/lib/supabase-server';

export interface AuthenticatedRouteHandler {
  (request: NextRequest, context: { params: any }, supabase: any, user: any): Promise<Response>;
}

export interface RouteHandler {
  (request: NextRequest, context: { params: any }): Promise<Response>;
}

/**
 * Higher-order function that wraps API route handlers with authentication and error handling
 */
export function withAuth(handler: AuthenticatedRouteHandler): RouteHandler {
  return async (request: NextRequest, context: { params: any }) => {
    try {
      const { supabase } = createSupabaseServerClientFromRequest(request);
      
      // Get user with error handling
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Authentication error in API route:', error.message);
        
        // Handle auth errors
        const errorResponse = handleAuthError(error, request);
        if (errorResponse) {
          return errorResponse;
        }
        
        return NextResponse.json(
          { error: 'Authentication failed', message: error.message },
          { status: 401 }
        );
      }
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required', message: 'No user found' },
          { status: 401 }
        );
      }
      
      // Call the original handler with authenticated context
      return await handler(request, context, supabase, user);
      
    } catch (error: any) {
      console.error('Unexpected error in API route:', error);
      
      // Handle auth errors at the catch level
      const errorResponse = handleAuthError(error, request);
      if (errorResponse) {
        return errorResponse;
      }
      
      return NextResponse.json(
        { error: 'Internal server error', message: error.message },
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function for admin-only routes
 */
export function withAdminAuth(handler: AuthenticatedRouteHandler): RouteHandler {
  return withAuth(async (request, context, supabase, user) => {
    try {
      // Check admin status from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_admin')
        .eq('id', user.id)
        .maybeSingle();
      
      let isAdmin = false;
      
      if (!profileError && profile) {
        isAdmin = profile.is_admin === true || profile.role === 'admin';
      } else {
        // Fallback to user metadata
        isAdmin = user.user_metadata?.role === 'admin';
      }
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required', message: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      
      return await handler(request, context, supabase, user);
      
    } catch (error: any) {
      console.error('Admin auth check error:', error);
      return NextResponse.json(
        { error: 'Authorization failed', message: error.message },
        { status: 403 }
      );
    }
  });
}

/**
 * Wrapper for API routes that don't require authentication but need error handling
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context: { params: any }) => {
    try {
      return await handler(request, context);
    } catch (error: any) {
      console.error('API route error:', error);
      
      // Handle auth errors even in non-auth routes
      const errorResponse = handleAuthError(error, request);
      if (errorResponse) {
        return errorResponse;
      }
      
      return NextResponse.json(
        { error: 'Internal server error', message: error.message },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper for routes that need Supabase client but not authentication
 */
export function withSupabase(handler: (request: NextRequest, context: { params: any }, supabase: any) => Promise<Response>): RouteHandler {
  return async (request: NextRequest, context: { params: any }) => {
    try {
      const { supabase } = createSupabaseServerClientFromRequest(request);
      return await handler(request, context, supabase);
    } catch (error: any) {
      console.error('Supabase client error:', error);
      
      const errorResponse = handleAuthError(error, request);
      if (errorResponse) {
        return errorResponse;
      }
      
      return NextResponse.json(
        { error: 'Database connection error', message: error.message },
        { status: 500 }
      );
    }
  };
}
