import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdminAuth } from "@/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminAuth(request);
    const supabase = supabaseServer();
    const { eventIds, action } = await request.json();

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ error: "Event IDs array is required" }, { status: 400 });
    }

    let result;
    switch (action) {
      case 'delete':
        result = await supabase
          .from("events")
          .delete()
          .in("id", eventIds);
        break;
      
      case 'publish':
        result = await supabase
          .from("events")
          .update({ is_published: true, updated_at: new Date().toISOString() })
          .in("id", eventIds);
        break;
      
      case 'unpublish':
        result = await supabase
          .from("events")
          .update({ is_published: false, updated_at: new Date().toISOString() })
          .in("id", eventIds);
        break;
      
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (result.error) throw result.error;

    return NextResponse.json({ message: `Bulk ${action} completed successfully` });
  } catch (error: any) {
    const status = error.message.includes("Admin access required") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
