import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdminAuth } from "@/utils/requireAuth";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const supabase = supabaseServer();
    const schema = z.object({
      eventIds: z.array(z.string().min(1)).min(1),
      action: z.enum(['delete', 'publish', 'unpublish']),
    });
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const { eventIds, action } = parsed.data;

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
          .update({ is_published: true, published: true, updated_at: new Date().toISOString() })
          .in("id", eventIds);
        if ((result.error as any)?.code === '42703') {
          result = await supabase
            .from("events")
            .update({ published: true, updated_at: new Date().toISOString() })
            .in("id", eventIds);
        }
        break;
      
      case 'unpublish':
        result = await supabase
          .from("events")
          .update({ is_published: false, published: false, updated_at: new Date().toISOString() })
          .in("id", eventIds);
        if ((result.error as any)?.code === '42703') {
          result = await supabase
            .from("events")
            .update({ published: false, updated_at: new Date().toISOString() })
            .in("id", eventIds);
        }
        break;
      
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (result.error) throw result.error;

    return NextResponse.json({ message: `Bulk ${action} completed successfully` });
  } catch (error: any) {
    // Check if error is a NextResponse (from requireAdminAuth)
    if (error && typeof error.json === 'function') {
      return error;
    }
    const msg = error?.message || '';
    const status = msg.includes('Admin access required') ? 403 : msg.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: msg || 'Server error' }, { status });
  }
}
