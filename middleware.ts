import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  // Skip middleware for API routes, static files, and admin routes
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/admin/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/superadmin/') ||
    url.pathname.startsWith('/pricing') ||
    url.pathname.startsWith('/join') ||
    url.pathname.startsWith('/test') ||
    url.pathname.startsWith('/debug') ||
    url.pathname.startsWith('/demo') ||
    url.pathname.startsWith('/test-confirmation') ||
    url.pathname.startsWith('/test-inputs') ||
    url.pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Check if this is a subdomain request
  const subdomain = getSubdomain(hostname)
  
  if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
    // Rewrite to subdomain-specific route
    url.pathname = `/subdomain/${subdomain}${url.pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

function getSubdomain(hostname: string): string | null {
  // Handle localhost development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const parts = hostname.split('.')
    if (parts.length > 1 && parts[0] !== 'www') {
      return parts[0]
    }
    return null
  }

  // Handle production domains
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    return parts[0]
  }
  
  return null
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
