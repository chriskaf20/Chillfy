export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdminAuth } from "@/utils/requireAuth";
import { z } from "zod";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireAdminAuth();
    
    const supabase = supabaseServer();
    // Fetch event
    const { data: event, error: evErr } = await supabase
      .from("events")
      .select("*")
      .eq("id", params.id)
      .single();

    if (evErr || !event) throw evErr || new Error("Event not found");

    // Fetch RSVP count and list
    const [{ count: attendee_count }, { data: attendeesData }] = await Promise.all([
      supabase.from("rsvps").select("*", { count: "exact", head: true }).eq("event_id", params.id),
      supabase.from("rsvps").select("user_id, created_at").eq("event_id", params.id),
    ]);

    return NextResponse.json({
      ...event,
      attendee_count: attendee_count || 0,
      attendees: attendeesData || [],
    });
  } catch (error: any) {
    const msg = error?.message || '';
    const status = msg.includes('Admin access required') ? 403 : msg.includes('Authentication required') ? 401 : 500;
    return NextResponse.json({ error: msg || 'Server error' }, { status });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireAdminAuth();
    
    const schema = z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(5000).optional(),
      date: z.string().min(1).max(50).optional(),
      time: z.string().min(1).max(50).optional().nullable(),
      end_times: z.string().min(1).max(50).optional().nullable(),
      location: z.string().min(1).max(200).optional().nullable(),
      country: z.string().min(1).max(100).optional().nullable(),
      venue: z.string().min(1).max(200).optional().nullable(),
      address: z.string().max(500).optional().nullable(),
      category: z.string().min(1).max(100).optional().nullable(),
      image_url: z.string().url().max(500).optional().nullable(),
      price: z.coerce.number().min(0).optional().nullable(),
      currency: z.string().min(1).max(10).optional(),
      max_attendees: z.coerce.number().int().min(0).optional().nullable(),
      tags: z.array(z.string()).optional().nullable(),
      ticket_link: z.string().url().max(500).optional().nullable(),
      map_link: z.string().url().max(500).optional().nullable(),
      dress_code: z.string().max(200).optional().nullable(),
      menu: z.string().max(2000).optional().nullable(),
      organizer_name: z.string().max(200).optional().nullable(),
      is_published: z.boolean().optional(),
      is_featured: z.boolean().optional(),
    });
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const eventData = parsed.data;
    const supabase = supabaseServer();
    
    const { data, error } = await supabase
      .from("events")
      .update({
        ...eventData,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    const msg = error?.message || '';
    const status = msg.includes('Admin access required') ? 403 : msg.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: msg || 'Server error' }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdminAuth();

    const supabase = supabaseServer();
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
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