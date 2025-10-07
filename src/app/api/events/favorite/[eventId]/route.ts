import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Force dynamic rendering for auth/session-sensitive API route
export const dynamic = "force-dynamic";

// Robust server client creation with better error handling
function createSupabaseFromRequest(request: NextRequest) {
  console.log('🔍 Creating Supabase client from request...');
  
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = request.cookies.get(name);
            const value = cookie?.value;
            console.log(`🍪 Getting cookie '${name}':`, value ? 'found' : 'not found');
            return value;
          },
          set(name: string, value: string, options: any) {
            console.log(`🍪 Set cookie '${name}' requested (ignored in API route)`);
          },
          remove(name: string, options: any) {
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
 * GET /api/events/favorite/[eventId]
 * - Returns whether the event is in the user's interests
 * - Response: { isFavorite: boolean }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  console.log("✅ GET /api/events/favorite/[eventId] - start");
  try {
    const supabase = createSupabaseFromRequest(request);
    const { eventId } = params;

    // Auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.warn("❌ GET /api/events/favorite/[eventId] - unauthenticated", userError);
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.log(`✅ GET /api/events/favorite/[eventId] - user: ${user.id}, eventId: ${eventId}`);

    // Check if interest exists
    const { data, error } = await supabase
      .from("event_interests")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .limit(1);

    if (error) {
      console.error("❌ GET /api/events/favorite/[eventId] - failed to check interest", error);
      return NextResponse.json({ error: "Failed to check interest status" }, { status: 500 });
    }

    const isFavorite = Array.isArray(data) && data.length > 0;

    console.log(`✅ GET /api/events/favorite/[eventId] - isFavorite: ${isFavorite}`);
    return NextResponse.json({ isFavorite });
  } catch (err) {
    console.error("❌ GET /api/events/favorite/[eventId] - internal error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
