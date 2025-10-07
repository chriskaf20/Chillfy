-- Remove organizer_id column and related constraints from events table
-- This migration aligns with the simplified organizer model where events
-- only store organizer_name as text instead of foreign key references

-- First, remove the index on organizer_id
DROP INDEX IF EXISTS idx_events_organizer;

-- Remove Row Level Security policies that reference organizer_id
DROP POLICY IF EXISTS "events_select_published" ON public.events;
DROP POLICY IF EXISTS "events_insert_authenticated" ON public.events;  
DROP POLICY IF EXISTS "events_update_owner_or_admin" ON public.events;
DROP POLICY IF EXISTS "attendees_select_own_or_organizer" ON public.event_attendees;

-- Remove the organizer_id column (this will automatically remove the foreign key constraint)
ALTER TABLE public.events DROP COLUMN IF EXISTS organizer_id;

-- Recreate simplified RLS policies that only use admin role checks
CREATE POLICY "events_select_published" ON public.events
  FOR SELECT USING (is_published = true);

CREATE POLICY "events_insert_admin_only" ON public.events
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "events_update_admin_only" ON public.events
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "events_delete_admin_only" ON public.events
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Update attendees policy to be simpler
CREATE POLICY "attendees_select_own" ON public.event_attendees
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "attendees_insert_own" ON public.event_attendees
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "attendees_update_own" ON public.event_attendees
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "attendees_delete_own" ON public.event_attendees
  FOR DELETE TO authenticated USING (user_id = auth.uid());
