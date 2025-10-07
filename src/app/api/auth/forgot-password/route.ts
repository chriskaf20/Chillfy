import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase";
import { forgotPasswordSchema } from "@/utils/validation";
import { RateLimiter, strictRateLimit } from "@/utils/rateLimiter";

export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting for password reset
    const rateLimiter = RateLimiter.getInstance();
    const { allowed, remainingRequests, resetTime } = await rateLimiter.isAllowed(request, {
      ...strictRateLimit,
      maxRequests: 3 // Only 3 password reset attempts per minute
    });
    
    if (!allowed) {
      return NextResponse.json(
        { 
          error: "Too many password reset attempts. Please try again later.",
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
    
    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid email address", 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    const supabase = supabaseClient();

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    });

    if (error) {
      console.error('❌ Password reset error:', error.message);
      
      // Don't reveal whether email exists or not for security
      return NextResponse.json(
        { message: "If an account with this email exists, you will receive a password reset link." },
        { status: 200 }
      );
    }

    console.log('✅ Password reset email sent for:', email);

    return NextResponse.json({
      message: "If an account with this email exists, you will receive a password reset link.",
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
