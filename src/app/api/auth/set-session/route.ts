export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  try {
    // Enhanced CSRF protection
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const referer = request.headers.get("referer");
    
    if (!origin || !host || new URL(origin).host !== host) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Additional referer check
    if (referer && !referer.startsWith(origin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Check for XMLHttpRequest header (additional protection)
    const requestedWith = request.headers.get("x-requested-with");
    if (requestedWith !== "XMLHttpRequest") {
      console.warn("Set-session request without XMLHttpRequest header");
    }

    const body = await request.json();
    const { access_token, refresh_token } = body;

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: "Missing access_token or refresh_token" },
        { status: 400 }
      );
    }

    // Validate token format (basic check)
    if (typeof access_token !== 'string' || typeof refresh_token !== 'string' ||
        access_token.length < 10 || refresh_token.length < 10) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    let response = NextResponse.json({ ok: true });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24 * 7, // 7 days
            });
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: "",
              ...options,
              expires: new Date(0),
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error('❌ Set session error:', error.message);
      return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
    }

    console.log('✅ Session cookies set successfully');
    return response;
  } catch (err: any) {
    console.error('❌ Set session internal error:', err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
