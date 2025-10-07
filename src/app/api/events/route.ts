import { NextResponse, NextRequest } from "next/server";
import { supabaseClient } from "@/lib/supabase";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdminAuth } from "@/utils/requireAuth";
import { z } from "zod";
import { SUPPORTED_CURRENCIES, sanitizeCurrency } from "@/utils/currencyUtils";
import type { CurrencyCode } from "@/types/event";

// -------------------------
// GET Events
// -------------------------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Validate and coerce query params
  const querySchema = z.object({
    id: z.string().optional(),
    related: z.enum(["true", "false"]).optional(),
    category: z.string().trim().min(1).max(100).optional(),
    location: z.string().trim().min(1).max(100).optional(),
    q: z
      .string()
      .trim()
      .max(100)
      // Remove SQL LIKE wildcards to prevent unintended broad queries
      .transform((s) => s.replace(/[%_]/g, ""))
      .optional(),
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 1))
      .pipe(z.number().int().min(1).catch(1)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 12))
      .pipe(z.number().int().min(1).max(100).catch(12)),
  });

  const parsed = querySchema.safeParse({
    id: searchParams.get("id") ?? undefined,
    related: searchParams.get("related") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    location: searchParams.get("location") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, related, category, location, q, page, limit } = parsed.data;

  try {
    // Use anon client for public events API; avoid service role in public endpoints
    const supabase = supabaseClient();

  if (id) {
      // Get single event with complete schema
      const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();

      if (error || !event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      // If related requested, fetch them
      let relatedEvents: any[] = [];
      if (related === "true") {
        const { data: rel } = await supabase
          .from("events")
          .select("id, title, image_url, poster_image_url, date, time, end_times, location, category, price, currency")
          .neq("id", id)
          .or(`category.eq.${event.category || ""},location.eq.${event.location || ""}`)
          .eq("is_published", true)
          .limit(3);
        
        relatedEvents = rel || [];
      }

      return NextResponse.json({ event, related: relatedEvents });
    }

    // Otherwise → list events (published only) with pagination and total count
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("events")
      .select(
        "id, title, description, image_url, poster_image_url, date, time, end_times, location, country, category, price, currency, tags",
        { count: "exact" }
      )
      .eq("is_published", true)
      .order("date", { ascending: true })
      .range(from, to);

    if (category) query = query.eq("category", category);
    if (location) query = query.eq("location", location);
    if (q) {
      // Case-insensitive match on title or description
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("/api/events list query failed", error);
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasMore = page < totalPages;

    return NextResponse.json({
      events: data ?? [],
      count: total,
      page,
      pageSize: limit,
      totalPages,
      hasMore,
    });
  } catch (err: any) {
    console.error("GET /api/events failed", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

// -------------------------
// POST New Event (Admin only)
// -------------------------
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdminAuth();
    const supabase = supabaseServer();

    const body = await request.json();

    // Validate body with zod
    const bodySchema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().min(1).max(5000),
      date: z.string().min(1).max(50),
      time: z.string().min(1).max(50).optional().nullable(),
      location: z.string().min(1).max(200).optional().nullable(),
      category: z.string().min(1).max(100).optional().nullable(),
      image_url: z.string().url().max(500).optional().nullable(),
      price: z.coerce.number().min(0).optional(),
      currency: z.string().refine((val) => SUPPORTED_CURRENCIES.includes(val as CurrencyCode), {
        message: "Invalid currency code"
      }).optional(),
      capacity: z.coerce.number().int().min(0).optional().nullable(),
      organizer_name: z.string().min(1).max(200).optional(),
    });

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const b = parsed.data;
    const now = new Date().toISOString();
    const doc = {
      title: b.title.trim(),
      description: b.description.trim(),
      date: b.date.trim(),
      time: b.time && b.time.trim() ? b.time.trim() : null,
      location: b.location && b.location.trim() ? b.location.trim() : null,
      category: b.category && b.category.trim() ? b.category.trim() : null,
      image_url: b.image_url ?? null,
      price: b.price ?? 0,
      currency: b.currency ?? "USD", // Use provided currency or default to USD
      capacity: b.capacity ?? null,
      organizer_name: b.organizer_name?.trim() ?? "Admin",
      created_at: now,
      updated_at: now,
    } as const;

    const { data, error } = await supabase
      .from("events")
      .insert([doc])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    // Check if error is a NextResponse (from requireAdminAuth)
    if (err && typeof err.json === 'function') {
      return err;
    }
    console.error("POST /api/events failed", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
