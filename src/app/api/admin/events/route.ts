import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdminAuth } from "@/utils/requireAuth";

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAdminAuth();
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
    if (error instanceof NextResponse) {
      return error;
    }
    const status = error.message.includes("Admin access required") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAdminAuth();
    const supabase = supabaseServer();
    const eventData = await request.json();
    
    // Validate required fields
    if (!eventData.title || !eventData.date) {
      return NextResponse.json(
        { error: "Title and date are required" }, 
        { status: 400 }
      );
    }

    // Prepare event data for insertion
    const insertData = {
      title: eventData.title,
      description: eventData.description || null,
      image_url: eventData.image_url || null,
      location: eventData.location || null,
      country: eventData.country || null,
      venue: eventData.venue || null,
      address: eventData.address || null,
      date: eventData.date,
      time: eventData.time || null,
      end_times: eventData.end_times || null,
      price: eventData.price || null,
      currency: eventData.currency || 'EUR',
      category: eventData.category || null,
      tags: eventData.tags || null,
      max_attendees: eventData.max_attendees || null,
      ticket_link: eventData.ticket_link || null,
      map_link: eventData.map_link || null,
      dress_code: eventData.dress_code || null,
      menu: eventData.menu || null,
      is_published: eventData.is_published || false,
      organizer_name: eventData.organizer_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
      current_attendees: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("events")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating event:', error);
      throw new Error('Failed to create event: ' + error.message);
    }

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error('Error creating event:', error);
    const status = error.message.includes("Admin access required") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}