export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdminAuth } from "@/utils/requireAuth";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdminAuth();

    const { is_published } = await request.json();
    const supabase = supabaseServer();
    
    // Try updating both potential columns to keep data consistent if both exist
    let { data, error } = await supabase
      .from("events")
      .update({ 
        is_published,
        published: is_published,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single();

    // If the is_published column doesn't exist, retry updating only updated_at
    if ((error as any)?.code === "42703") {
      // Retry updating using only `published`
      const retry = await supabase
        .from("events")
        .update({ published: is_published, updated_at: new Date().toISOString() })
        .eq("id", params.id)
        .select()
        .single();
      data = retry.data;
      error = retry.error as any;
    }

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    // Check if error is a NextResponse (from requireAdminAuth)
    if (error && typeof error.json === 'function') {
      return error;
    }
    const msg = error?.message || '';
    const status = msg.includes('Admin access required') ? 403 : msg.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: msg || 'Server error' }, { status });
  }
}