// Simple in-flight request cache to dedupe rapid, identical calls
const inFlight = new Map<string, Promise<any>>();

export async function fetchEvents(params: { q?: string; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.limit) qs.set("limit", params.limit.toString());

  const query = qs.toString();
  const url = `/api/events${query ? `?${query}` : ""}`;
  // Dedupe identical concurrent/rapid calls
  const existing = inFlight.get(url);
  if (existing) return existing;

  const promise = (async () => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to fetch events");
    }
    return res.json();
  })()
    .finally(() => {
      // Small delay keeps result available for micro-bursts while ensuring freshness
      setTimeout(() => inFlight.delete(url), 300);
    });

  inFlight.set(url, promise);
  return promise;
}
