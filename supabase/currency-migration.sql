-- Supabase Currency Migration SQL
-- Copy-paste this into your Supabase SQL editor

-- 1. Create currency_enum type with 50+ most common ISO 4217 currency codes
DO $$ 
BEGIN
    -- Drop the enum if it exists (in case you need to re-run)
    DROP TYPE IF EXISTS currency_enum CASCADE;
    
    -- Create the new enum with comprehensive currency list
    CREATE TYPE currency_enum AS ENUM (
        'USD', -- US Dollar
        'EUR', -- Euro
        'GBP', -- British Pound Sterling
        'JPY', -- Japanese Yen
        'AUD', -- Australian Dollar
        'CAD', -- Canadian Dollar
        'CHF', -- Swiss Franc
        'CNY', -- Chinese Yuan
        'SEK', -- Swedish Krona
        'NOK', -- Norwegian Krone
        'MXN', -- Mexican Peso
        'INR', -- Indian Rupee
        'NZD', -- New Zealand Dollar
        'SGD', -- Singapore Dollar
        'HKD', -- Hong Kong Dollar
        'KRW', -- South Korean Won
        'TRY', -- Turkish Lira
        'RUB', -- Russian Ruble
        'BRL', -- Brazilian Real
        'ZAR', -- South African Rand
        'PLN', -- Polish Zloty
        'ILS', -- Israeli New Shekel
        'DKK', -- Danish Krone
        'CZK', -- Czech Koruna
        'HUF', -- Hungarian Forint
        'RON', -- Romanian Leu
        'BGN', -- Bulgarian Lev
        'HRK', -- Croatian Kuna
        'THB', -- Thai Baht
        'MYR', -- Malaysian Ringgit
        'IDR', -- Indonesian Rupiah
        'PHP', -- Philippine Peso
        'VND', -- Vietnamese Dong
        'EGP', -- Egyptian Pound
        'AED', -- UAE Dirham
        'SAR', -- Saudi Riyal
        'QAR', -- Qatari Riyal
        'KWD', -- Kuwaiti Dinar
        'BHD', -- Bahraini Dinar
        'OMR', -- Omani Rial
        'JOD', -- Jordanian Dinar
        'LBP', -- Lebanese Pound
        'CLP', -- Chilean Peso
        'COP', -- Colombian Peso
        'PEN', -- Peruvian Sol
        'ARS', -- Argentine Peso
        'UYU', -- Uruguayan Peso
        'BOB', -- Bolivian Boliviano
        'PYG', -- Paraguayan Guarani
        'CRC', -- Costa Rican Colon
        'GTQ', -- Guatemalan Quetzal
        'HNL', -- Honduran Lempira
        'NIO', -- Nicaraguan Cordoba
        'PAB', -- Panamanian Balboa
        'DOP', -- Dominican Peso
        'JMD', -- Jamaican Dollar
        'TTD', -- Trinidad and Tobago Dollar
        'BBD', -- Barbadian Dollar
        'BZD', -- Belize Dollar
        'XCD', -- East Caribbean Dollar
        'GYD', -- Guyanese Dollar
        'SRD', -- Surinamese Dollar
        'FJD', -- Fijian Dollar
        'PGK', -- Papua New Guinea Kina
        'SBD', -- Solomon Islands Dollar
        'TOP', -- Tongan Pa'anga
        'VUV', -- Vanuatu Vatu
        'WST', -- Samoan Tala
        'XPF', -- CFP Franc
        'CYP'  -- Cyprus Pound (for Cyprus)
    );
END $$;

-- 2. Update the events table to use the new enum type
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_currency_check;

-- Add temporary column with new enum type
ALTER TABLE public.events 
ADD COLUMN currency_new currency_enum DEFAULT 'USD';

-- Copy existing currency values to new column (with fallback to USD)
UPDATE public.events 
SET currency_new = CASE 
    WHEN currency = 'EUR' THEN 'EUR'::currency_enum
    WHEN currency = 'USD' THEN 'USD'::currency_enum  
    WHEN currency = 'TRY' THEN 'TRY'::currency_enum
    ELSE 'USD'::currency_enum
END;

-- Drop the old currency column and rename the new one
ALTER TABLE public.events DROP COLUMN currency;
ALTER TABLE public.events RENAME COLUMN currency_new TO currency;

-- Set NOT NULL constraint with default value
ALTER TABLE public.events 
ALTER COLUMN currency SET NOT NULL,
ALTER COLUMN currency SET DEFAULT 'USD';

-- Add comment for documentation
COMMENT ON COLUMN public.events.currency IS 'ISO 4217 currency code for event pricing. Defaults to USD.';

-- Update any existing NULL currencies to USD
UPDATE public.events SET currency = 'USD' WHERE currency IS NULL;

-- Verify the migration
SELECT DISTINCT currency FROM public.events;

-- Optional: Show the enum values for verification
SELECT unnest(enum_range(NULL::currency_enum)) AS supported_currencies;
