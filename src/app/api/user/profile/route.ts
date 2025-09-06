import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase";
import { requireAuth } from "@/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || "",
      role: user.user_metadata?.role || "attendee",
      image: user.user_metadata?.avatar_url,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { name, image } = await request.json();
    
    const supabase = supabaseClient();
    
    // Update user metadata
    const { data, error } = await supabase.auth.updateUser({
      data: {
        name,
        avatar_url: image,
        role: user.user_metadata?.role || "attendee",
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || "",
      role: data.user.user_metadata?.role || "attendee",
      image: data.user.user_metadata?.avatar_url,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
