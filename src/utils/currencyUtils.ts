import { CurrencyCode } from '@/types/event';

// Currency display names and symbols
export const CURRENCY_INFO: Record<CurrencyCode, { name: string; symbol: string; }> = {
  USD: { name: 'US Dollar', symbol: '$' },
  EUR: { name: 'Euro', symbol: '€' },
  GBP: { name: 'British Pound', symbol: '£' },
  JPY: { name: 'Japanese Yen', symbol: '¥' },
  AUD: { name: 'Australian Dollar', symbol: 'A$' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF' },
  CNY: { name: 'Chinese Yuan', symbol: '¥' },
  SEK: { name: 'Swedish Krona', symbol: 'kr' },
  NOK: { name: 'Norwegian Krone', symbol: 'kr' },
  MXN: { name: 'Mexican Peso', symbol: '$' },
  INR: { name: 'Indian Rupee', symbol: '₹' },
  NZD: { name: 'New Zealand Dollar', symbol: 'NZ$' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$' },
  HKD: { name: 'Hong Kong Dollar', symbol: 'HK$' },
  KRW: { name: 'South Korean Won', symbol: '₩' },
  TRY: { name: 'Turkish Lira', symbol: '₺' },
  RUB: { name: 'Russian Ruble', symbol: '₽' },
  BRL: { name: 'Brazilian Real', symbol: 'R$' },
  ZAR: { name: 'South African Rand', symbol: 'R' },
  PLN: { name: 'Polish Zloty', symbol: 'zł' },
  ILS: { name: 'Israeli New Shekel', symbol: '₪' },
  DKK: { name: 'Danish Krone', symbol: 'kr' },
  CZK: { name: 'Czech Koruna', symbol: 'Kč' },
  HUF: { name: 'Hungarian Forint', symbol: 'Ft' },
  RON: { name: 'Romanian Leu', symbol: 'lei' },
  BGN: { name: 'Bulgarian Lev', symbol: 'лв' },
  HRK: { name: 'Croatian Kuna', symbol: 'kn' },
  THB: { name: 'Thai Baht', symbol: '฿' },
  MYR: { name: 'Malaysian Ringgit', symbol: 'RM' },
  IDR: { name: 'Indonesian Rupiah', symbol: 'Rp' },
  PHP: { name: 'Philippine Peso', symbol: '₱' },
  VND: { name: 'Vietnamese Dong', symbol: '₫' },
  EGP: { name: 'Egyptian Pound', symbol: '£' },
  AED: { name: 'UAE Dirham', symbol: 'د.إ' },
  SAR: { name: 'Saudi Riyal', symbol: '﷼' },
  QAR: { name: 'Qatari Riyal', symbol: '﷼' },
  KWD: { name: 'Kuwaiti Dinar', symbol: 'د.ك' },
  BHD: { name: 'Bahraini Dinar', symbol: '.د.ب' },
  OMR: { name: 'Omani Rial', symbol: '﷼' },
  JOD: { name: 'Jordanian Dinar', symbol: 'د.ا' },
  LBP: { name: 'Lebanese Pound', symbol: '£' },
  CLP: { name: 'Chilean Peso', symbol: '$' },
  COP: { name: 'Colombian Peso', symbol: '$' },
  PEN: { name: 'Peruvian Sol', symbol: 'S/' },
  ARS: { name: 'Argentine Peso', symbol: '$' },
  UYU: { name: 'Uruguayan Peso', symbol: '$' },
  BOB: { name: 'Bolivian Boliviano', symbol: 'Bs' },
  PYG: { name: 'Paraguayan Guarani', symbol: '₲' },
  CRC: { name: 'Costa Rican Colon', symbol: '₡' },
  GTQ: { name: 'Guatemalan Quetzal', symbol: 'Q' },
  HNL: { name: 'Honduran Lempira', symbol: 'L' },
  NIO: { name: 'Nicaraguan Cordoba', symbol: 'C$' },
  PAB: { name: 'Panamanian Balboa', symbol: 'B/.' },
  DOP: { name: 'Dominican Peso', symbol: '$' },
  JMD: { name: 'Jamaican Dollar', symbol: 'J$' },
  TTD: { name: 'Trinidad and Tobago Dollar', symbol: 'TT$' },
  BBD: { name: 'Barbadian Dollar', symbol: '$' },
  BZD: { name: 'Belize Dollar', symbol: 'BZ$' },
  XCD: { name: 'East Caribbean Dollar', symbol: '$' },
  GYD: { name: 'Guyanese Dollar', symbol: 'G$' },
  SRD: { name: 'Surinamese Dollar', symbol: '$' },
  FJD: { name: 'Fijian Dollar', symbol: 'FJ$' },
  PGK: { name: 'Papua New Guinea Kina', symbol: 'K' },
  SBD: { name: 'Solomon Islands Dollar', symbol: 'SI$' },
  TOP: { name: 'Tongan Pa\'anga', symbol: 'T$' },
  VUV: { name: 'Vanuatu Vatu', symbol: 'VT' },
  WST: { name: 'Samoan Tala', symbol: 'WS$' },
  XPF: { name: 'CFP Franc', symbol: '₣' },
  CYP: { name: 'Cyprus Pound', symbol: '£' },
};

// Get all supported currencies as array
export const SUPPORTED_CURRENCIES: CurrencyCode[] = Object.keys(CURRENCY_INFO) as CurrencyCode[];

// Most commonly used currencies (for priority display)
export const POPULAR_CURRENCIES: CurrencyCode[] = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'TRY', 'INR'
];

// Format price with currency
export function formatPrice(price: number | null | undefined, currency: CurrencyCode = 'USD'): string {
  if (price === null || price === undefined) {
    return 'Free';
  }
  
  if (price === 0) {
    return 'Free';
  }

  const currencyInfo = CURRENCY_INFO[currency];
  const symbol = currencyInfo?.symbol || currency;
  
  // Format based on currency conventions
  if (['JPY', 'KRW', 'VND', 'IDR', 'PYG'].includes(currency)) {
    // These currencies typically don't use decimal places
    return `${symbol}${Math.round(price).toLocaleString()}`;
  }
  
  return `${symbol}${price.toFixed(2)}`;
}

// Get currency symbol
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCY_INFO[currency]?.symbol || currency;
}

// Get currency name
export function getCurrencyName(currency: CurrencyCode): string {
  return CURRENCY_INFO[currency]?.name || currency;
}

// Ensure currency is valid, fallback to USD
export function sanitizeCurrency(currency: string | null | undefined): CurrencyCode {
  if (currency && (SUPPORTED_CURRENCIES as string[]).includes(currency)) {
    return currency as CurrencyCode;
  }
  return 'USD';
}
