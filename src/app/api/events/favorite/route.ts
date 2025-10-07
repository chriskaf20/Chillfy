import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Force dynamic rendering for auth/session-sensitive API route
export const dynamic = "force-dynamic";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type EventRow = Record<string, JsonValue>;

// Robust server client creation with better error handling
function createSupabaseFromRequest(request: NextRequest) {
  console.log('🔍 Creating Supabase client from request...');
  
  // Log available cookies for debugging
  const cookies = request.cookies.getAll();
  console.log('Available cookies:', cookies.map(c => ({
    name: c.name,
    hasValue: !!c.value,
    length: c.value?.length || 0
  })));

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = request.cookies.get(name);
            const value = cookie?.value;
            
            // Log cookie access attempts
            console.log(`🍪 Getting cookie '${name}':`, value ? 'found' : 'not found');
            
            return value;
          },
          set(name: string, value: string, options: any) {
            // Server-side: we don't set cookies in API routes
            console.log(`🍪 Set cookie '${name}' requested (ignored in API route)`);
          },
          remove(name: string, options: any) {
            // Server-side: we don't remove cookies in API routes
            console.log(`🍪 Remove cookie '${name}' requested (ignored in API route)`);
          },
        },
      }
    );
    
    console.log('✅ Supabase client created successfully');
    return supabase;
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    throw error;
  }
}

/**
 * GET /api/events/favorite
 * - Returns all interested events for the authenticated user.
 * - Joins event_interests -> events and returns the event rows.
 * - Filters published events by `events.is_published = true`.
 * - Response: { favorites: Event[] }
 */
export async function GET(request: NextRequest) {
  console.log("✅ GET /api/events/favorite - start");
  try {
    const supabase = createSupabaseFromRequest(request);

    // Auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.warn("❌ GET /api/events/favorite - unauthenticated", userError);
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.log(`✅ GET /api/events/favorite - user: ${user.id}`);

    // Query event_interests with events join
    const { data, error } = await supabase
      .from("event_interests")
      .select(`
        id,
        user_id,
        event_id,
        created_at,
        events!inner(*)
      `)
      .eq("user_id", user.id)
      .eq("events.is_published", true);

    if (error) {
      console.error("❌ GET /api/events/favorite - failed to fetch interests", error);
      return NextResponse.json({ error: "Failed to fetch interested events" }, { status: 500 });
    }

    const favorites: EventRow[] = (data as any[] | null | undefined)
      ?.map((row: any) => row.events)
      .filter(Boolean) ?? [];

    console.log(`✅ GET /api/events/favorite - returning ${favorites.length} favorite(s)`);
    return NextResponse.json({ favorites });
  } catch (err) {
    console.error("❌ GET /api/events/favorite - internal error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/events/favorite
 * - Body: { eventId }
 * - Toggles interest for (user_id, event_id) in event_interests table:
 *   - If exists => delete and return { action: "removed" }
 *   - If not => insert and return { action: "added" }
 */
export async function POST(request: NextRequest) {
  console.log("✅ POST /api/events/favorite - start");
  try {
    const supabase = createSupabaseFromRequest(request);

    // Auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.warn("❌ POST /api/events/favorite - unauthenticated", userError);
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.log(`✅ POST /api/events/favorite - user: ${user.id}`);

    // Parse body
    let body: any = null;
    try {
      body = await request.json();
    } catch (e) {
      console.warn("❌ POST /api/events/favorite - invalid JSON body", e);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

  const eventId = body?.eventId as string | undefined;
  if (!eventId || typeof eventId !== "string") {
      console.warn("❌ POST /api/events/favorite - missing/invalid eventId", body);
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }
    console.log(`ℹ️ POST /api/events/favorite - toggle eventId: ${eventId}`);

    // Check if interest exists
    const { data: existingRows, error: checkError } = await supabase
      .from("event_interests")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .limit(1);

    if (checkError) {
      console.error("❌ POST /api/events/favorite - failed to check interest", checkError);
      return NextResponse.json({ error: "Failed to check interest status" }, { status: 500 });
    }

    const exists = Array.isArray(existingRows) && existingRows.length > 0;

    if (exists) {
      // Remove interest
      const { error: delError } = await supabase
        .from("event_interests")
        .delete()
        .eq("user_id", user.id)
        .eq("event_id", eventId);

      if (delError) {
        console.error("❌ POST /api/events/favorite - failed to remove interest", delError);
        return NextResponse.json({ error: "Failed to remove interest" }, { status: 500 });
      }

      console.log("✅ POST /api/events/favorite - removed");
      return NextResponse.json({ action: "removed" });
    } else {
      // Add interest
      const { error: insertError } = await supabase
        .from("event_interests")
        .insert([{ user_id: user.id, event_id: eventId }]);

      if (insertError) {
        // Unique violation edge-case => treat as added (race condition)
        if ((insertError as any).code === "23505") {
          console.warn(
            "ℹ️ POST /api/events/favorite - conflict on insert, treating as added"
          );
          return NextResponse.json({ action: "added" });
        }

        console.error("❌ POST /api/events/favorite - failed to add interest", insertError);
        return NextResponse.json({ error: "Failed to add interest" }, { status: 500 });
      }

      console.log("✅ POST /api/events/favorite - added");
      return NextResponse.json({ action: "added" });
    }
  } catch (err) {
    console.error("❌ POST /api/events/favorite - internal error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
