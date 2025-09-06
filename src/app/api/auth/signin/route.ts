import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  // Redirect GET requests to the signin page
  const url = new URL("/auth/signin", request.url);
  return NextResponse.redirect(url.toString());
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = supabaseClient();
    
    // Use Supabase auth to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Sign in successful",
      user: data.user,
      session: data.session,
    });
  } catch (error: any) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
