import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClientFromRequest } from "@/lib/supabase-server";
import { signInSchema } from "@/utils/validation";
import { z } from "zod";
import { RateLimiter, authRateLimit } from "@/utils/rateLimiter";

export async function GET(request: NextRequest) {
  // Redirect GET requests to the signin page
  const url = new URL("/auth/signin", request.url);
  return NextResponse.redirect(url.toString());
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimiter = RateLimiter.getInstance();
    const { allowed, remainingRequests, resetTime } = await rateLimiter.isAllowed(request, authRateLimit);
    
    if (!allowed) {
      return NextResponse.json(
        { 
          error: "Too many sign-in attempts. Please try again later.",
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const body = await request.json();
    
    // Validate input using Zod schema
    const validationResult = signInSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid input", 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    console.log('🔐 Attempting sign in for:', email);

    // Use SSR-compatible Supabase client for proper cookie handling
    const { supabase } = createSupabaseServerClientFromRequest(request);
    
    // Use Supabase auth to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error.message);
      
      // Return user-friendly error messages
      let userMessage = 'Invalid email or password';
      if (error.message.includes('Email not confirmed')) {
        userMessage = 'Please check your email and confirm your account first';
      } else if (error.message.includes('Too many requests')) {
        userMessage = 'Too many attempts. Please wait and try again';
      }
      
      return NextResponse.json(
        { error: userMessage },
        { status: 401 }
      );
    }

    console.log('✅ Sign in successful for user:', data.user?.id);

    // Return success payload (cookies are managed client-side or via /api/auth/set-session)
    return NextResponse.json(
      {
        message: "Sign in successful",
        user: {
          id: data.user?.id,
          email: data.user?.email,
          role: data.user?.user_metadata?.role || 'attendee'
        },
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Signin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
