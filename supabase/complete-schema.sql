-- Complete Chillfy Database Schema
-- Run this in your Supabase SQL editor

-- 1. Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
  description TEXT,
  image_url TEXT,
  location TEXT CHECK (length(location) <= 200),
  city TEXT CHECK (length(city) <= 100),
  venue TEXT CHECK (length(venue) <= 200),
  address TEXT,
  date DATE NOT NULL,
  time TIME,
  end_times TIME,
  price DECIMAL(10,2) CHECK (price >= 0),
  currency TEXT DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'TRY')),
  category TEXT CHECK (category IN (
    'Music & Concerts',
    'Food & Drink', 
    'Arts & Culture',
    'Sports & Fitness',
    'Business & Networking',
    'Entertainment',
    'Education & Learning',
    'Community & Social',
    'Technology',
    'Health & Wellness'
  )),
  tags TEXT[],
  max_attendees INTEGER CHECK (max_attendees > 0),
  current_attendees INTEGER DEFAULT 0 CHECK (current_attendees >= 0),
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_free BOOLEAN GENERATED ALWAYS AS (price = 0 OR price IS NULL) STORED,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Additional event fields
  ticket_link TEXT,
  poster_image_url TEXT,
  event_type TEXT,
  min_age INTEGER CHECK (min_age >= 0 AND min_age <= 99),
  capacity INTEGER, -- alias for max_attendees
  moods TEXT[],
  menu TEXT,
  named_prices JSONB,
  dress_code TEXT,
  country TEXT DEFAULT 'CY',
  map_link TEXT,
  organizer_name TEXT,
  organizer_email TEXT,
  organizer_bio TEXT,
  organizer_avatar TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_attendee_count CHECK (current_attendees <= max_attendees)
);

-- 2. Event interests (many-to-many)
CREATE TABLE IF NOT EXISTS public.event_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, event_id)
);

-- 3. Event attendance tracking
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  attended_at TIMESTAMPTZ,
  
  UNIQUE(event_id, user_id)
);

-- 4. Event reviews/ratings
CREATE TABLE IF NOT EXISTS public.event_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT CHECK (length(comment) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(event_id, user_id)
);

-- 5. Contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) > 0),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  subject TEXT NOT NULL CHECK (length(subject) > 0),
  message TEXT NOT NULL CHECK (length(message) > 0),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_published ON public.events(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_event_interests_user ON public.event_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON public.event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_contact_status ON public.contact_submissions(status);

-- Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "events_select_published" ON public.events
  FOR SELECT USING (is_published = true OR organizer_id = auth.uid());

CREATE POLICY "events_insert_authenticated" ON public.events
  FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "events_update_owner_or_admin" ON public.events
  FOR UPDATE TO authenticated 
  USING (
    organizer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Event interests policies
CREATE POLICY "interests_select_own" ON public.event_interests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "interests_insert_own" ON public.event_interests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "interests_delete_own" ON public.event_interests
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Attendees policies (similar pattern)
CREATE POLICY "attendees_select_own_or_organizer" ON public.event_attendees
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid())
  );

-- Reviews policies
CREATE POLICY "reviews_select_all" ON public.event_reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_own" ON public.event_reviews
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Contact submissions (admin only)
CREATE POLICY "contact_admin_only" ON public.contact_submissions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Attendee count update function
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events 
    SET current_attendees = current_attendees + 1 
    WHERE id = NEW.event_id AND NEW.status = 'registered';
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      IF OLD.status = 'registered' AND NEW.status != 'registered' THEN
        UPDATE public.events SET current_attendees = current_attendees - 1 WHERE id = NEW.event_id;
      ELSIF OLD.status != 'registered' AND NEW.status = 'registered' THEN
        UPDATE public.events SET current_attendees = current_attendees + 1 WHERE id = NEW.event_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'registered' THEN
      UPDATE public.events SET current_attendees = current_attendees - 1 WHERE id = OLD.event_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_attendee_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.event_attendees
  FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();
