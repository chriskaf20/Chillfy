import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase";
import { signUpSchema } from "@/utils/validation";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input using Zod schema
    const validationResult = signUpSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid input", 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName } = validationResult.data;
    const fullName = `${firstName} ${lastName}`.trim();

    const supabase = supabaseClient();

    // Use Supabase auth to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: fullName,
          firstName,
          lastName,
          role: "attendee",
        },
      },
    });

    if (error) {
      console.error('❌ Sign up error:', error.message);
      
      // Return user-friendly error messages
      let userMessage = error.message;
      if (error.message.includes('already registered')) {
        userMessage = 'An account with this email already exists';
      } else if (error.message.includes('Password')) {
        userMessage = 'Password does not meet requirements';
      }
      
      return NextResponse.json(
        { error: userMessage },
        { status: 400 }
      );
    }

    console.log('✅ Sign up successful for user:', data.user?.id);

    return NextResponse.json({
      message: "Account created successfully. Please check your email to verify your account.",
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: fullName,
        role: 'attendee'
      },
      requiresVerification: !data.session // True if email confirmation is required
    }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
