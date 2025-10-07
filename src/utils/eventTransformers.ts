import type { Event, EventDetails, CurrencyCode } from '@/types/event';
import { sanitizeCurrency } from './currencyUtils';

/**
 * Transform event data from Supabase to ensure all required fields are present
 * and properly typed, especially currency which should never be null/undefined
 */
export function transformEvent(rawEvent: any): Event {
  return {
    ...rawEvent,
    currency: sanitizeCurrency(rawEvent.currency) as CurrencyCode,
    // Ensure other fields have proper defaults
    description: rawEvent.description ?? null,
    image_url: rawEvent.image_url ?? null,
    poster_image_url: rawEvent.poster_image_url ?? null,
    location: rawEvent.location ?? null,
    country: rawEvent.country ?? null,
    venue: rawEvent.venue ?? null,
    address: rawEvent.address ?? null,
    time: rawEvent.time ?? null,
    end_times: rawEvent.end_times ?? null,
    price: rawEvent.price ?? null,
    category: rawEvent.category ?? null,
    event_type: rawEvent.event_type ?? null,
    min_age: rawEvent.min_age ?? null,
    tags: rawEvent.tags ?? null,
    max_attendees: rawEvent.max_attendees ?? null,
    current_attendees: rawEvent.current_attendees ?? null,
    is_published: rawEvent.is_published ?? null,
    is_featured: rawEvent.is_featured ?? null,
    is_free: rawEvent.is_free ?? null,
    organizer_name: rawEvent.organizer_name ?? null,
    created_at: rawEvent.created_at ?? null,
    updated_at: rawEvent.updated_at ?? null,
  };
}

/**
 * Transform event details data from Supabase
 */
export function transformEventDetails(rawEvent: any): EventDetails {
  const baseEvent = transformEvent(rawEvent);
  
  return {
    ...baseEvent,
    ticket_link: rawEvent.ticket_link ?? null,
    named_prices: rawEvent.named_prices ?? null,
    poster_image_url: rawEvent.poster_image_url ?? null,
    map_link: rawEvent.map_link ?? null,
    dress_code: rawEvent.dress_code ?? null,
    menu: rawEvent.menu ?? null,
    moods: rawEvent.moods ?? null,
    organizer_name: rawEvent.organizer_name ?? null,
    organizer_email: rawEvent.organizer_email ?? null,
    organizer_bio: rawEvent.organizer_bio ?? null,
    organizer_avatar: rawEvent.organizer_avatar ?? null,
    capacity: rawEvent.capacity ?? null,
  };
}

/**
 * Transform an array of events from Supabase
 */
export function transformEvents(rawEvents: any[]): Event[] {
  return rawEvents.map(transformEvent);
}

/**
 * Transform an array of event details from Supabase
 */
export function transformEventDetailsList(rawEvents: any[]): EventDetails[] {
  return rawEvents.map(transformEventDetails);
}
