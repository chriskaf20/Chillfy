import { useEffect, useMemo, useState } from "react";
import { fetchEvents } from "@/utils/fetchEvents";
import { sanitizeCurrency } from "@/utils/currencyUtils";
import type { Event } from "@/types/event";

export default function useEvents(params: { q?: string; limit?: number } = {}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create stable, memoized params to avoid refetch loops due to object identity
  const normParams = useMemo(() => ({ q: params?.q ?? "", limit: params?.limit }), [params?.q, params?.limit]);

  // Normalize API event shape into UI event shape used by components
  const normalize = (e: any): Event => {
    const hasDate = typeof e?.date === "string" && e.date.length > 0;
    const hasTime = typeof e?.time === "string" && e.time.length > 0;

    return {
      id: String(e?.id ?? ""),
      title: String(e?.title ?? e?.name ?? ""),
      description: e?.description ?? null,
      image_url: e?.image_url ?? null,
      poster_image_url: e?.poster_image_url ?? null,
      location: e?.location ?? null,
      country: e?.country ?? null,
      date: e?.date || new Date().toISOString().split('T')[0], // Use date field
      time: e?.time ?? null, // Use time field
      end_times: e?.end_times ?? null, // Use end_times field
      price: typeof e?.price === "number" ? e.price : e?.price != null ? Number(e.price) : null,
      currency: sanitizeCurrency(e?.currency), // Ensure currency is always valid
      category: e?.category ?? null,
      is_published: typeof e?.is_published === "boolean" ? e.is_published : e?.published ?? null,
    };
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchEvents(normParams)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : Array.isArray(data?.events) ? data.events : [];
        setEvents(list.map(normalize));
      })
      .catch((e) => {
        if (cancelled) return;
        const message = typeof e?.message === "string" ? e.message : "Failed to load events";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [normParams]);

  return { events, loading, error };
}
