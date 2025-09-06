import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function getSupabaseUserFromRequest(request: NextRequest) {
  try {
    // Get the access token from the Authorization header or cookies
    let accessToken = null;
    
    // First try Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    } else {
      // Try to get from cookies (Supabase session cookies)
      const authCookie = request.cookies.get('sb-access-token')?.value;
      if (authCookie) {
        accessToken = authCookie;
      }
    }
    
    if (!accessToken) {
      return null;
    }

    // Create supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await getSupabaseUserFromRequest(request);
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  return user;
}

export async function requireAdminAuth(request: NextRequest) {
  const user = await requireAuth(request);
  
  // Check if user is admin from user metadata
  if (user.user_metadata?.role !== "admin") {
    throw new Error("Admin access required");
  }
  
  return user;
}
