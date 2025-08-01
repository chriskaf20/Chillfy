import { useEffect, useState } from "react";
import { fetchEvents } from "@/utils/fetchEvents";

type Event = {
  id: string;
  title: string;
  date: string;
  description: string;
};

export default function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { events, loading, error };
}