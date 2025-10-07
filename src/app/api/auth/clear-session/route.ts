import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 [ClearSession] Starting session cleanup...');

    const response = NextResponse.json({ success: true, message: 'Session cleared' });

    // List of common Supabase auth cookies to clear
    const authCookieNames = [
      'sb-access-token',
      'sb-refresh-token', 
      'supabase-auth-token',
      'supabase.auth.token',
      // Add any other auth-related cookies your app might use
    ];

    // Clear each auth cookie
    authCookieNames.forEach(cookieName => {
      response.cookies.set({
        name: cookieName,
        value: '',
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    });

    // Also clear any domain-specific cookies
    response.cookies.set({
      name: 'sb-access-token',
      value: '',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined,
    });

    console.log('✅ [ClearSession] Auth cookies cleared');

    return response;
  } catch (error) {
    console.error('❌ [ClearSession] Error clearing session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}
