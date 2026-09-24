import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth') || request.nextUrl.pathname === '/'
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  if (!user && !isAuthRoute) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Let's get the user's profile to check status and role
    const { data: profile } = await supabase.from('profiles').select('status, role').eq('id', user.id).single()

    if (profile) {
      if (profile.status === 'pending' && request.nextUrl.pathname !== '/pending') {
        const url = request.nextUrl.clone()
        url.pathname = '/pending'
        return NextResponse.redirect(url)
      }

      if (profile.status === 'rejected' || profile.status === 'suspended') {
        if (request.nextUrl.pathname !== '/rejected') {
            const url = request.nextUrl.clone()
            url.pathname = '/rejected'
            return NextResponse.redirect(url)
        }
      }

      if (isAdminRoute && profile.role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/home' // Redirect to home if not admin
        return NextResponse.redirect(url)
      }

      // If user is approved and on the root page or auth pages, redirect to home
      if ((isAuthRoute) && profile.status === 'approved' && request.nextUrl.pathname !== '/home') {
          const url = request.nextUrl.clone()
          url.pathname = '/home'
          return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
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
