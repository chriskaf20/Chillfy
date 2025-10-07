import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static assets and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  console.log(`🔍 Simple middleware processing: ${pathname}`);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // Set the cookie on the request so it's available immediately
            request.cookies.set({
              name,
              value,
              ...options,
            })
            // Also set on the response for future requests
            response.cookies.set({
              name,
              value,
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
          },
          remove(name: string, options: any) {
            // Remove from request
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            // Remove from response
            response.cookies.set({
              name,
              value: '',
              ...options,
              expires: new Date(0),
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
          },
        },
      }
    )

    // Refresh session if expired - this is important for SSR
    // Only do this if we're not dealing with API routes to avoid issues
    if (!pathname.startsWith('/api/')) {
      try {
        await supabase.auth.getUser()
      } catch (error) {
        console.warn('⚠️ Session refresh failed in middleware:', error);
        // Don't block the request, just log the warning
      }
    }

  } catch (error) {
    console.error('❌ Middleware error:', error);
    // Don't block the request due to auth errors
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
