// ISO 4217 Currency Codes supported by the application
export type CurrencyCode = 
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'CNY' | 'SEK' | 'NOK'
  | 'MXN' | 'INR' | 'NZD' | 'SGD' | 'HKD' | 'KRW' | 'TRY' | 'RUB' | 'BRL' | 'ZAR'
  | 'PLN' | 'ILS' | 'DKK' | 'CZK' | 'HUF' | 'RON' | 'BGN' | 'HRK' | 'THB' | 'MYR'
  | 'IDR' | 'PHP' | 'VND' | 'EGP' | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR'
  | 'JOD' | 'LBP' | 'CLP' | 'COP' | 'PEN' | 'ARS' | 'UYU' | 'BOB' | 'PYG' | 'CRC'
  | 'GTQ' | 'HNL' | 'NIO' | 'PAB' | 'DOP' | 'JMD' | 'TTD' | 'BBD' | 'BZD' | 'XCD'
  | 'GYD' | 'SRD' | 'FJD' | 'PGK' | 'SBD' | 'TOP' | 'VUV' | 'WST' | 'XPF' | 'CYP';

export type Event = {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  poster_image_url?: string | null;
  location?: string | null;
  country?: string | null;
  venue?: string | null;
  address?: string | null;
  date: string; // DATE NOT NULL in schema
  time?: string | null; // TIME field for start time
  end_times?: string | null; // TIME field for end time
  price?: number | null;
  currency: CurrencyCode; // Now required with proper typing
  category?: string | null;
  event_type?: string | null;
  min_age?: number | null;
  tags?: string[] | null;
  max_attendees?: number | null;
  current_attendees?: number | null;
  is_published?: boolean | null;
  is_featured?: boolean | null;
  is_free?: boolean | null;
  organizer_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

// Extended type for detailed event view with all possible fields
export type EventDetails = Event & {
  ticket_link?: string | null;
  named_prices?: Record<string, number> | null;
  poster_image_url?: string | null;
  map_link?: string | null;
  dress_code?: string | null;
  menu?: string | null;
  moods?: string[] | null;
  organizer_name?: string | null;
  organizer_email?: string | null;
  organizer_bio?: string | null;
  organizer_avatar?: string | null;
  capacity?: number | null; // alias for max_attendees
};

// For interests API response
export type InterestEvent = {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
  event?: EventDetails;
};