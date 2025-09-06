import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAuth } from "@/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = supabaseServer();

    // Get user's favorite events with full event details
    const { data: favorites, error } = await supabase
      .from("event_attendees")
      .select(`
        event_id,
        events (
          id,
          title,
          description,
          date,
          time,
          venue,
          city,
          price,
          currency,
          category,
          image_url,
          is_featured,
          is_published
        )
      `)
      .eq("user_id", user.id)
      .eq("is_favorite", true)
      .eq("events.is_published", true);

    if (error) throw error;

    // Transform the data to match the expected format
    const favoriteEvents = favorites?.map(fav => fav.events).filter(Boolean) || [];

    return NextResponse.json({ favorites: favoriteEvents });
  } catch (error: any) {
    const status = error.message === "Authentication required" ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { eventId } = await request.json();
    
    const supabase = supabaseServer();

    // Check if the event is already favorited
    const { data: existing, error: checkError } = await supabase
      .from("event_attendees")
      .select("id, is_favorite")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      throw checkError;
    }

    if (existing) {
      // If record exists, toggle the favorite status or delete if not favorite
      if (existing.is_favorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("event_attendees")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Update to favorite
        const { error } = await supabase
          .from("event_attendees")
          .update({ is_favorite: true })
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (error) throw error;
      }
    } else {
      // Create new favorite record
      const { error } = await supabase
        .from("event_attendees")
        .insert({
          event_id: eventId,
          user_id: user.id,
          is_favorite: true,
          status: 'interested'
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message === "Authentication required" ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
