import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Protected routes
  const protectedRoutes = [
    '/dashboard',
    '/checkout',
    '/checkin',
    '/api/orders',
    '/api/checkin',
  ]

  const isProtected = protectedRoutes.some((route) => path.startsWith(route))

  // Public routes that don't require auth
  const publicRoutes = [
    '/login',
    '/register',
    '/api/auth',
    '/events',
    '/event',
    '/_next',
  ]

  const isPublic = publicRoutes.some((route) => path.startsWith(route))

  // For protected routes, we need to check auth
  if (isProtected && !isPublic) {
    // In a real app, verify session token
    // For now, just pass through
  }

  // Admin routes
  if (path.startsWith('/admin') && !request.headers.get('x-admin-token')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, images, etc.)
    '/((?!_next|images|favicon.ico).*)',
  ],
}
