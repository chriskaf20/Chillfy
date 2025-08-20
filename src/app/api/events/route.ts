import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id"); // fetch single event
  const related = searchParams.get("related"); // "true" → also fetch related
  const category = searchParams.get("category");
  const location = searchParams.get("location");

  try {
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
      let relatedEvents = [];
      if (related === "true") {
        const { data: rel } = await supabase
          .from("events")
          .select("id, title, name, image_url, date, time, location, category, price, description")
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
    let query = supabase.from("events").select("*").order("date", { ascending: true });

    if (category) query = query.eq("category", category);
    if (location) query = query.eq("location", location);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
