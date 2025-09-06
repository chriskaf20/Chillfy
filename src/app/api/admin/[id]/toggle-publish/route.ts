import { NextResponse, NextRequest } from "next/server";
import { requireAdminAuth } from "@/utils/auth";
import { supabaseServer } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminUser = await requireAdminAuth(request);
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { is_published } = await request.json();
    const supabase = supabaseServer();
    
    const { data, error } = await supabase
      .from("events")
      .update({ 
        is_published,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}