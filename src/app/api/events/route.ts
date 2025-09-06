import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdminAuth } from "@/utils/auth";

// -------------------------
// GET Events
// -------------------------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id"); // fetch single event
  const related = searchParams.get("related"); // "true" → also fetch related
  const category = searchParams.get("category");
  const location = searchParams.get("location");

  try {
    const supabase = supabaseServer();
    
    if (id) {
      // Get single event
      const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      // If related requested, fetch them
      let relatedEvents: any[] = [];
      if (related === "true") {
        const { data: rel } = await supabase
          .from("events")
          .select(
            "id, title, image_url, date, time, location, category, price, description"
          )
          .neq("id", id)
          .or(
            `category.eq.${event.category || ""},location.eq.${event.location || ""}`
          )
          .limit(3);

        relatedEvents = rel || [];
      }

      return NextResponse.json({ event, related: relatedEvents });
    }

    // Otherwise → list events
    let query = supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    if (category) query = query.eq("category", category);
    if (location) query = query.eq("location", location);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// -------------------------
// POST New Event (Admin only)
// -------------------------
export async function POST(req: Request) {
  try {
    // Verify admin authentication
    const adminUser = await requireAdminAuth(req as any);
    const supabase = supabaseServer();
    
    const body = await req.json();

    // ✅ Basic validation
    if (!body.title || body.title.trim() === "") {
      return NextResponse.json(
        { error: "Event title is required" },
        { status: 400 }
      );
    }

    if (!body.description || body.description.trim() === "") {
      return NextResponse.json(
        { error: "Event description is required" },
        { status: 400 }
      );
    }

    if (!body.date) {
      return NextResponse.json(
        { error: "Event date is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.from("events").insert([
      {
        title: body.title,
        description: body.description,
        date: body.date,
        time: body.time || null,
        location: body.location || null,
        category: body.category || null,
        image_url: body.image_url || null,
        price: body.price || 0,
        currency: body.currency || "TRY",
        capacity: body.capacity || null,
        organizer_name: body.organizer_name || "Admin",
      },
    ]);

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
