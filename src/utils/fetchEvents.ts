export async function fetchEvents(params: { q?: string; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.limit) qs.set("limit", params.limit.toString());

  const res = await fetch(`/api/events?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch events");
  }
  return res.json();
}
