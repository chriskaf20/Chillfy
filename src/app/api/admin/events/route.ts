import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAdminAuth() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return null;
  }
  
  const { data: user } = await supabase
    .from("users")
    .select("id, role")
    .eq("email", session.user.email)
    .single();
    
  return user?.role === 'admin' ? user : null;
}

export async function GET() {
  try {
    const adminUser = await checkAdminAuth();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        attendee_count:event_attendees(count)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform the data to include attendee count
    const eventsWithCounts = data?.map(event => ({
      ...event,
      attendee_count: event.attendee_count?.[0]?.count || 0
    }));

    return NextResponse.json(eventsWithCounts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await checkAdminAuth();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}