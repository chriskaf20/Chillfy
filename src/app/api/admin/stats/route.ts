export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdminAuth } from "@/utils/requireAuth";

export async function GET(request: NextRequest) {
	try {
		const { user } = await requireAdminAuth();
		const supabase = supabaseServer();

		const today = new Date().toISOString().split("T")[0];

		const totalQ = supabase
			.from("events")
			.select("*", { count: "exact", head: true });

		const publishedQ = supabase
			.from("events")
			.select("*", { count: "exact", head: true })
			.eq("is_published", true);

		const attendeesQ = supabase
			.from("rsvps")
			.select("*", { count: "exact", head: true });

		const upcomingQ = supabase
			.from("events")
			.select("*", { count: "exact", head: true })
			.eq("is_published", true)
			.gte("date", today);

		let [
			{ count: total_events, error: totalErr },
			{ count: published_events, error: pubErr },
			{ count: total_attendees },
			{ count: upcoming_events, error: upcErr },
		] = await Promise.all([totalQ, publishedQ, attendeesQ, upcomingQ]);

		// Fallback if is_published column is missing
		if ((pubErr as any)?.code === "42703" || (upcErr as any)?.code === "42703") {
			const [
				{ count: total_events_fallback },
				{ count: upcoming_events_fallback },
			] = await Promise.all([
				supabase.from("events").select("*", { count: "exact", head: true }),
				supabase
					.from("events")
					.select("*", { count: "exact", head: true })
					.gte("date", today),
			]);
			// Treat all events as published when flag is absent
			total_events = total_events ?? total_events_fallback ?? 0;
			published_events = total_events;
			upcoming_events = upcoming_events_fallback ?? 0;
		}

		if (totalErr) throw totalErr;

		return NextResponse.json({
			total_events: total_events || 0,
			published_events: published_events || 0,
			total_attendees: total_attendees || 0,
			upcoming_events: upcoming_events || 0,
		});
		} catch (error: any) {
			if (error instanceof NextResponse) {
				return error;
			}
			const msg = error?.message || '';
			const status = msg.includes('Admin access required') ? 403 : msg.includes('Unauthorized') ? 401 : 500;
			return NextResponse.json({ error: msg || 'Server error' }, { status });
		}
}
