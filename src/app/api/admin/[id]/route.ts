import { NextResponse, NextRequest } from "next/server";
import { requireAdminAuth } from "@/utils/auth";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminUser = await requireAdminAuth(request);
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        attendee_count:event_attendees(count),
        attendees:event_attendees(
          user_id,
          status,
          created_at,
          user:users(name, email)
        )
      `)
      .eq("id", params.id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      ...data,
      attendee_count: data.attendee_count?.[0]?.count || 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminUser = await requireAdminAuth(request);
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const eventData = await request.json();
    const supabase = supabaseServer();
    
    const { data, error } = await supabase
      .from("events")
      .update({
        ...eventData,
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminUser = await requireAdminAuth(request);
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = supabaseServer();
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}