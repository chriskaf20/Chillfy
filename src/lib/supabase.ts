// Server/Client helpers for Supabase
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client-side (public)
export const supabaseClient = () =>
  createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } });

// Server-side (use service role when needed)
export const supabaseServer = () => {
  if (!service) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, service);
};
