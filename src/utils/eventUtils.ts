import type { Event, EventDetails, CurrencyCode } from '@/types/event';
import { sanitizeCurrency } from './currencyUtils';

/**
 * Ensures event data has proper currency field
 * Transforms raw database data to properly typed Event objects
 */
export function sanitizeEvent(rawEvent: any): Event {
  return {
    ...rawEvent,
    currency: sanitizeCurrency(rawEvent.currency) as CurrencyCode,
  } as Event;
}

/**
 * Ensures event details data has proper currency field
 */
export function sanitizeEventDetails(rawEvent: any): EventDetails {
  return {
    ...rawEvent,
    currency: sanitizeCurrency(rawEvent.currency) as CurrencyCode,
  } as EventDetails;
}

/**
 * Sanitizes an array of events
 */
export function sanitizeEvents(rawEvents: any[]): Event[] {
  return rawEvents.map(sanitizeEvent);
}

/**
 * Utility to safely format price with proper currency fallback
 */
export function safeFormatPrice(price: number | null | undefined, currency: string | null | undefined): string {
  const safeCurrency = sanitizeCurrency(currency);
  
  if (price === null || price === undefined || price === 0) {
    return 'Free';
  }
  
  // Use Intl.NumberFormat for proper currency formatting
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  } catch (error) {
    // Fallback if currency is not supported by Intl.NumberFormat
    return `${price} ${safeCurrency}`;
  }
}
