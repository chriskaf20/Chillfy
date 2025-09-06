import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdminAuth } from "@/utils/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth(request);
    const supabase = supabaseServer();

    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get attendee counts for each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const { count } = await supabase
          .from("event_attendees")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id);
        
        return { ...event, attendee_count: count || 0 };
      })
    );

    return NextResponse.json(eventsWithCounts);
  } catch (error: any) {
    const status = error.message.includes("Admin access required") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminAuth(request);
    const supabase = supabaseServer();
    const eventData = await request.json();
    
    const { data, error } = await supabase
      .from("events")
      .insert({
        ...eventData,
        organizer_id: adminUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    const status = error.message.includes("Admin access required") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}