import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdminAuth } from "@/utils/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth(request);
    
    const supabase = supabaseServer();
    
    // Get all users from auth.users table via Supabase Admin API
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) throw error;

    // Format the user data
    const formattedUsers = users.users.map(user => ({
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
      email: user.email || '',
      role: user.user_metadata?.role || 'attendee',
      created_at: user.created_at,
      last_login: user.last_sign_in_at,
      email_confirmed: user.email_confirmed_at ? true : false
    }));

    return NextResponse.json(formattedUsers);
  } catch (error: any) {
    const status = error.message.includes("Admin access required") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth(request);
    
    const { email, password, name, role } = await request.json();
    
    const supabase = supabaseServer();
    
    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        role: role || 'attendee'
      },
      email_confirm: true
    });

    if (error) throw error;

    return NextResponse.json({
      id: data.user.id,
      name: data.user.user_metadata?.name || name,
      email: data.user.email,
      role: data.user.user_metadata?.role || 'attendee',
      created_at: data.user.created_at
    }, { status: 201 });
  } catch (error: any) {
    const status = error.message.includes("Admin access required") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
