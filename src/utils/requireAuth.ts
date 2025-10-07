import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseServer } from "@/lib/supabase-server";

export interface AuthResult {
  user: any;
  supabase: any;
}

/**
 * Shared authentication utility for API routes
 * - Gets the current user with supabase.auth.getUser()
 * - Returns 401 JSON response if no user is found
 * - Returns { user, supabase } if the user is authenticated
 */
export async function requireAuth(): Promise<AuthResult> {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Note: In API routes, we can't set cookies directly
          // This is handled by the response in set-session endpoint
        },
        remove(name: string, options: any) {
          // Note: In API routes, we can't remove cookies directly
        },
      },
    }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new NextResponse(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return { user, supabase };
}

/**
 * Enhanced authentication utility that also checks for admin privileges
 * - First calls requireAuth() to ensure user is authenticated
 * - Then checks if user has admin role from profiles table or user metadata
 * - Returns 403 JSON response if user is not an admin
 * - Returns { user, supabase } if the user is an authenticated admin
 */
export async function requireAdminAuth(): Promise<AuthResult> {
  const { user, supabase } = await requireAuth();
  
  // Check admin status from profiles table first
  try {
    const adminSupabase = supabaseServer();
    const { data, error } = await adminSupabase
      .from('profiles')
      .select('role,is_admin')
      .eq('id', user.id)
      .maybeSingle();
    
    if (!error && data) {
      if ((data as any).is_admin === true || (data as any).role === 'admin') {
        return { user, supabase };
      }
    }
  } catch (e) {
    console.warn('requireAdminAuth: profiles lookup failed, using metadata fallback');
  }

  // Fallback to user metadata
  if (user.user_metadata?.role === "admin") {
    return { user, supabase };
  }
  
  throw new NextResponse(
    JSON.stringify({ error: "Admin access required" }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
}
