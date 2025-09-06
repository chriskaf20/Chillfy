import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import Link from "next/link";
import { Calendar, MapPin, Clock } from "lucide-react";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = supabaseServer();
  
  // 1. Fetch current event
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !event) {
    notFound();
  }

  // 2. Fetch related events
  const { data: related } = await supabase
    .from("events")
    .select("id, title, name, image_url, date, time, location, category, price, description")
    .neq("id", params.id)
    .eq("is_published", true)
    .or(
      `category.eq.${event.category || ""},location.eq.${event.location || ""}`
    )
    .limit(3);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      {/* Event image */}
      {event.image_url && (
        <div className="mb-6 h-80 overflow-hidden rounded-lg shadow-md">
          <img
            src={event.image_url}
            alt={event.title || event.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Event title */}
      <h1 className="text-3xl font-bold mb-2">
        {event.title || event.name}
      </h1>

      {event.category && (
        <span className="bg-teal-100 text-teal-800 text-xs px-3 py-1 rounded-full">
          {event.category}
        </span>
      )}

      {/* Event metadata */}
      <div className="mt-4 space-y-2 text-gray-600">
        {event.date && (
          <div className="flex items-center">
            <Calendar size={16} className="mr-2 text-gray-400" />
            <span>{formatDate(event.date)}</span>
          </div>
        )}
        {event.time && (
          <div className="flex items-center">
            <Clock size={16} className="mr-2 text-gray-400" />
            <span>{event.time}</span>
          </div>
        )}
        {event.location && (
          <div className="flex items-center">
            <MapPin size={16} className="mr-2 text-gray-400" />
            <span>{event.location}</span>
          </div>
        )}
      </div>

      {/* Event description */}
      {event.description && (
        <p className="mt-6 text-lg text-gray-700 leading-relaxed">
          {event.description}
        </p>
      )}

      {/* Event pricing + tickets */}
      <div className="mt-6 flex items-center justify-between">
        {event.price != null && (
          <span className="text-2xl font-bold text-teal-600">
            {event.price === 0 ? "Free" : `${event.price}₺`}
          </span>
        )}
        {event.ticket_link && (
          <a
            href={event.ticket_link}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Get Tickets
          </a>
        )}
      </div>

      {/* Related Events */}
      {related && related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Related Events</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {related.map((ev) => (
              <div
                key={ev.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                {ev.image_url && (
                  <div className="h-40 bg-gray-200 overflow-hidden">
                    <img
                      src={ev.image_url}
                      alt={ev.title || ev.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                    {ev.title || ev.name}
                  </h3>
                  {ev.date && (
                    <p className="text-sm text-gray-600 mb-2">
                      {formatDate(ev.date)}
                    </p>
                  )}
                  {ev.location && (
                    <p className="text-sm text-gray-600">{ev.location}</p>
                  )}

                  <div className="mt-4 flex justify-between items-center">
                    {ev.price != null && (
                      <span className="text-sm font-bold text-teal-600">
                        {ev.price === 0 ? "Free" : `${ev.price}₺`}
                      </span>
                    )}
                    <Link
                      href={`/events/${ev.id}`}
                      className="text-teal-600 hover:underline text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
