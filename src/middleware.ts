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
      if (isAdminRoute && profile.role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/home' // Redirect to home if not admin
        return NextResponse.redirect(url)
      }

      // If user is on auth routes but already logged in, redirect to home
      if (isAuthRoute && request.nextUrl.pathname !== '/home') {
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
