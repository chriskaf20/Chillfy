import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdminAuth } from "@/utils/requireAuth";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdminAuth();

    const { is_featured } = await request.json();
    const supabase = supabaseServer();
    
    let { data, error } = await supabase
      .from("events")
      .update({ 
        // may fail if column doesn't exist; we'll handle below
        is_featured,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single();

    // If the is_featured column doesn't exist, retry updating only updated_at
    if ((error as any)?.code === "42703") {
      const retry = await supabase
        .from("events")
        .update({ updated_at: new Date().toISOString() })
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
