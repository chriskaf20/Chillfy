import { useEffect, useState } from "react";
import { fetchEvents } from "@/utils/fetchEvents";

export type Event = {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  city?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  price?: number | null;
  category?: string | null;
  published?: boolean | null;
};

export default function useEvents(params: { q?: string; limit?: number } = {}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchEvents(params)
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.q, params.limit]);

  return { events, loading, error };
}
