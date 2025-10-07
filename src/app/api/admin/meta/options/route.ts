import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdminAuth } from "@/utils/requireAuth";
import { SUPPORTED_CURRENCIES, POPULAR_CURRENCIES, CURRENCY_INFO } from "@/utils/currencyUtils";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();
    const supabase = supabaseServer();

    // Fallbacks if columns/tables differ
    const defaultCategories = [
      "MUSIC",
      "ART",
      "SPORTS",
      "TECH",
      "BUSINESS",
      "EDUCATION",
      "HEALTH",
      "FOOD",
      "TRAVEL",
      "COMMUNITY",
    ];
    const defaultCurrencies = ["TRY", "USD", "EUR", "GBP"];
    const defaultEventTypes = [
      "CONCERT",
      "PARTY",
      "FESTIVAL",
      "MEETUP",
      "WORKSHOP",
      "CONFERENCE",
      "SPORTS",
      "OTHER",
    ];

    // Gather categories from existing events (distinct via JS)
    let categories: string[] = [];
    try {
      const { data, error } = await supabase
        .from("events")
        .select("category")
        .not("category", "is", null)
        .limit(1000);
      if (!error && data) {
        const uniq = new Set<string>();
        for (const row of data as any[]) {
          if (row.category && typeof row.category === "string") {
            uniq.add(row.category);
          }
        }
        categories = Array.from(uniq).sort((a, b) => a.localeCompare(b));
      }
    } catch {}

  // Gather currencies if column exists
    let currencies: string[] = [];
    // Gather event types from both event_type (text) and category (enum)
    let eventTypes: string[] = [];
    try {
      const { data, error } = await supabase
        .from("events")
        .select("event_type, category")
        .limit(1000);
      if (!error && data) {
        const uniq = new Set<string>();
        for (const row of data as any[]) {
          if (row.event_type && typeof row.event_type === 'string') uniq.add(row.event_type);
          if (row.category && typeof row.category === 'string') uniq.add(row.category);
        }
        eventTypes = Array.from(uniq).sort((a, b) => a.localeCompare(b));
      }
    } catch {}
    try {
      const { data, error } = await supabase
        .from("events")
        .select("currency")
        .not("currency", "is", null)
        .limit(1000);
      if (!error && data) {
        const uniq = new Set<string>();
        for (const row of data as any[]) {
          if (row.currency && typeof row.currency === "string") uniq.add(row.currency);
        }
        currencies = Array.from(uniq).sort((a, b) => a.localeCompare(b));
      }
    } catch (e: any) {
      // If column is missing (42703), ignore and use defaults later
    }

    return NextResponse.json({
      categories: categories.length ? categories : defaultCategories,
      currencies: SUPPORTED_CURRENCIES.map(code => ({
        code,
        name: CURRENCY_INFO[code].name,
        symbol: CURRENCY_INFO[code].symbol,
        popular: POPULAR_CURRENCIES.includes(code)
      })),
      eventTypes: eventTypes.length ? eventTypes : defaultEventTypes,
    });
  } catch (error: any) {
    // Check if error is a NextResponse (from requireAdminAuth)
    if (error && typeof error.json === 'function') {
      return error;
    }
    const msg = error?.message || '';
    const status = msg.includes('Admin access required') ? 403 : msg.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: msg || "Failed to load options" }, { status });
  }
}
