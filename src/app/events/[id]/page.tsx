import { notFound } from "next/navigation";
import { supabaseClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Clock, Users, DollarSign, ExternalLink, Tag, User } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import { formatPrice, sanitizeCurrency } from "@/utils/currencyUtils";
import type { EventDetails } from "@/types/event";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = supabaseClient();
  
  // 1. Fetch current event with all fields
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .eq("is_published", true)
    .single();

  if (error || !event) {
    console.error("Event not found:", error);
    notFound();
  }

  // 2. Fetch related events
  const { data: related } = await supabase
    .from("events")
    .select("id, title, image_url, poster_image_url, date, time, end_times, location, category, price, currency")
    .neq("id", params.id)
    .or(`category.eq.${event.category || ""},location.eq.${event.location || ""}`)
    .eq("is_published", true)
    .limit(3);

  const eventData = event as EventDetails;

  const formatDate = (dateString: string) => {
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

  const formatTime = (timeString?: string | null) => {
    if (!timeString) return "";
    try {
      // Parse time in HH:MM format
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeString;
    }
  };

  const formatPrice = (price: number | null | undefined, currency: string | null | undefined) => {
    if (price === null || price === undefined || price === 0) return "Free";
    const currencySymbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "₺";
    return `${price}${currencySymbol}`;
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      {/* Hero Section */}
      <div className="relative mb-8">
        {eventData.poster_image_url && (
          <div className="h-96 overflow-hidden rounded-2xl shadow-lg relative">
            <Image
              src={eventData.poster_image_url || "/chillfy-logo.png"}
              alt={eventData.title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 1024px, 100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{eventData.title}</h1>
                  {eventData.category && (
                    <span className="bg-teal-500 text-white text-sm px-3 py-1 rounded-full">
                      {eventData.category}
                    </span>
                  )}
                </div>
                <FavoriteButton eventId={eventData.id} size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20" />
              </div>
            </div>
          </div>
        )}

        {!eventData.poster_image_url && (
          <div className="h-64 bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl shadow-lg flex items-center justify-center relative">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">{eventData.title}</h1>
              {eventData.category && (
                <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
                  {eventData.category}
                </span>
              )}
            </div>
            <div className="absolute top-6 right-6">
              <FavoriteButton eventId={eventData.id} size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Event Details Grid */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-2xl font-semibold mb-6">Event Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date & Time */}
              <div className="flex items-start space-x-3">
                <Calendar className="text-teal-500 mt-1" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900">Date & Time</h3>
                  <p className="text-gray-600">{formatDate(eventData.date)}</p>
                  <p className="text-gray-600">
                    {formatTime(eventData.time)}
                    {eventData.end_times && ` - ${formatTime(eventData.end_times)}`}
                  </p>
                </div>
              </div>

              {/* Location */}
              {(eventData.location || eventData.venue || eventData.address) && (
                <div className="flex items-start space-x-3">
                  <MapPin className="text-teal-500 mt-1" size={20} />
                  <div>
                    <h3 className="font-medium text-gray-900">Location</h3>
                    {eventData.venue && <p className="text-gray-600 font-medium">{eventData.venue}</p>}
                    {eventData.address && <p className="text-gray-600">{eventData.address}</p>}
                    {eventData.location && <p className="text-gray-600">{eventData.location}</p>}
                    {eventData.country && <p className="text-gray-600">{eventData.country}</p>}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="flex items-start space-x-3">
                <DollarSign className="text-teal-500 mt-1" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900">Price</h3>
                  <p className="text-2xl font-bold text-teal-600">
                    {formatPrice(eventData.price, sanitizeCurrency(eventData.currency))}
                  </p>
                </div>
              </div>

              {/* Capacity */}
              {eventData.max_attendees && (
                <div className="flex items-start space-x-3">
                  <Users className="text-teal-500 mt-1" size={20} />
                  <div>
                    <h3 className="font-medium text-gray-900">Capacity</h3>
                    <p className="text-gray-600">
                      {eventData.current_attendees || 0} / {eventData.max_attendees} attendees
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-teal-500 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(((eventData.current_attendees || 0) / eventData.max_attendees) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {eventData.description && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-2xl font-semibold mb-4">About This Event</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {eventData.description}
                </p>
              </div>
            </div>
          )}

          {/* Tags */}
          {eventData.tags && eventData.tags.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-2xl font-semibold mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {eventData.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    <Tag size={14} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Event Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-2xl font-semibold mb-4">Event Details</h2>
            <div className="space-y-4">
              {/* Event Type */}
              {eventData.event_type && (
                <div>
                  <h3 className="font-medium text-gray-900">Event Type</h3>
                  <p className="text-gray-600">{eventData.event_type}</p>
                </div>
              )}

              {/* Minimum Age */}
              {eventData.min_age && (
                <div>
                  <h3 className="font-medium text-gray-900">Minimum Age</h3>
                  <p className="text-gray-600">{eventData.min_age}+</p>
                </div>
              )}

              {/* Dress Code */}
              {eventData.dress_code && (
                <div>
                  <h3 className="font-medium text-gray-900">Dress Code</h3>
                  <p className="text-gray-600">{eventData.dress_code}</p>
                </div>
              )}

              {/* Menu */}
              {eventData.menu && (
                <div>
                  <h3 className="font-medium text-gray-900">Menu</h3>
                  <p className="text-gray-600">{eventData.menu}</p>
                </div>
              )}

              {/* Moods */}
              {eventData.moods && eventData.moods.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900">Moods</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {eventData.moods.map((mood, index) => (
                      <span 
                        key={index}
                        className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-sm"
                      >
                        {mood}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Country */}
              {eventData.country && (
                <div>
                  <h3 className="font-medium text-gray-900">Country</h3>
                  <p className="text-gray-600">{eventData.country}</p>
                </div>
              )}
            </div>
          </div>

          {/* Organizer Info */}
          {(eventData.organizer_name || eventData.organizer_bio) && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-2xl font-semibold mb-4">Organizer</h2>
              <div className="space-y-3">
                {eventData.organizer_name && (
                  <h3 className="font-medium text-gray-900">{eventData.organizer_name}</h3>
                )}
                {eventData.organizer_bio && (
                  <p className="text-gray-600">{eventData.organizer_bio}</p>
                )}
                {eventData.organizer_email && (
                  <p className="text-sm text-gray-500">Contact: {eventData.organizer_email}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="space-y-4">
              {/* Get Tickets Button */}
              {eventData.ticket_link ? (
                <a
                  href={eventData.ticket_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  Get Tickets
                  <ExternalLink size={16} />
                </a>
              ) : (
                <div className="w-full bg-gray-100 text-gray-500 px-6 py-3 rounded-lg text-center font-medium">
                  No tickets available
                </div>
              )}

              {/* Map Link */}
              {eventData.map_link && (
                <a
                  href={eventData.map_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  View on Map
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Organizer Info */}
          {(eventData.organizer_name || eventData.organizer_bio || eventData.organizer_email) && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Organizer</h3>
              <div className="flex items-center space-x-3">
                {eventData.organizer_avatar ? (
                  <Image
                    src={eventData.organizer_avatar}
                    alt={eventData.organizer_name || "Organizer"}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={20} className="text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {eventData.organizer_name || "Anonymous Organizer"}
                  </p>
                  {eventData.organizer_bio && (
                    <p className="text-sm text-gray-600 mt-1">{eventData.organizer_bio}</p>
                  )}
                  {eventData.organizer_email && (
                    <p className="text-sm text-gray-500 mt-1">Contact: {eventData.organizer_email}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          {(eventData.dress_code || eventData.menu) && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
              <div className="space-y-3">
                {eventData.dress_code && (
                  <div>
                    <h4 className="font-medium text-gray-900">Dress Code</h4>
                    <p className="text-gray-600">{eventData.dress_code}</p>
                  </div>
                )}
                {eventData.menu && (
                  <div>
                    <h4 className="font-medium text-gray-900">Menu</h4>
                    <p className="text-gray-600">{eventData.menu}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Events */}
      {related && related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-3xl font-semibold mb-8">You Might Also Like</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((ev: { id: string; title: string; poster_image_url?: string; image_url?: string; location?: string; price?: number; currency?: string; category?: string; date: string }) => (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                {ev.poster_image_url && (
                  <div className="h-48 bg-gray-200 overflow-hidden relative">
                    <Image
                      src={ev.poster_image_url || "/chillfy-logo.png"}
                      alt={ev.title}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                  </div>
                )}

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                    {ev.title}
                  </h3>
                  {ev.date && (
                    <p className="text-sm text-gray-600 mb-2">
                      {formatDate(ev.date)}
                    </p>
                  )}
                  {ev.location && (
                    <p className="text-sm text-gray-600 mb-3">{ev.location}</p>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-teal-600">
                      {formatPrice(ev.price, sanitizeCurrency(ev.currency))}
                    </span>
                    <span className="text-teal-600 text-sm font-medium">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
