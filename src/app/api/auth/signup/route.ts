import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error("Error checking user existence:", userError);
      return NextResponse.json(
        { error: "Error checking user existence" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, 12);

    // Create new user with all required fields
    const now = new Date().toISOString();
    const { data: newUser, error: createUserError } = await supabase
      .from("users")
      .insert([{ 
        email, 
        password_hash,
        email_verified: null,
        created_at: now,
        updated_at: now,
        role: 'attendee'
      }])
      .select()
      .single();

    if (createUserError) {
      console.error("Error creating user:", createUserError);
      return NextResponse.json(
        { error: "Error creating user account" },
        { status: 500 }
      );
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
