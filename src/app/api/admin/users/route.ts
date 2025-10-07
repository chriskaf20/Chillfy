export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdminAuth } from "@/utils/requireAuth";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAdminAuth();
    
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
    if (error instanceof NextResponse) {
      return error;
    }
    const msg = error?.message || '';
    const status = msg.includes('Admin access required') ? 403 : msg.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: msg || 'Server error' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAdminAuth();
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8).max(200),
      name: z.string().min(1).max(200).optional(),
    });
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { email, password, name } = parsed.data;

    const supabase = supabaseServer();
    
    // Create new user - only attendees can be created via API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        role: 'attendee'
      },
  email_confirm: true
    });

    if (error) throw error;

    return NextResponse.json({
      id: data.user.id,
      name: data.user.user_metadata?.name || name,
      email: data.user.email,
      role: 'attendee',
      created_at: data.user.created_at
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error;
    }
    const msg = error?.message || '';
    const status = msg.includes('Admin access required') ? 403 : msg.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: msg || 'Server error' }, { status });
  }
}
