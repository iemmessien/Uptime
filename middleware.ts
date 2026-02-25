import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Log ALL query parameters
  const params = Object.fromEntries(searchParams.entries());
  console.log('[Middleware] Request:', pathname, 'Query params:', params);

  // CRITICAL: Skip middleware for API routes first (before any other checks)
  if (pathname.startsWith('/api/') || pathname.startsWith('/uptime/api/')) {
    console.log('[Middleware] Allowing API route');
    return NextResponse.next();
  }

  // Skip for Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images/') ||
    pathname.includes('/favicon') ||
    pathname.match(/\.(jpg|jpeg|png|gif|ico|svg|css|js)$/)
  ) {
    console.log('[Middleware] Allowing static file');
    return NextResponse.next();
  }

  // Allow access to login page
  if (pathname === '/login' || pathname === '/uptime/login') {
    console.log('[Middleware] Allowing login page');
    return NextResponse.next();
  }

  console.log('[Middleware] Checking authentication for:', pathname);

  // Check for URL-based authentication (username and password in query params)
  const urlUsername = searchParams.get('username');
  const urlPassword = searchParams.get('password');
  
  console.log('[Middleware] URL params - username:', urlUsername, 'password:', urlPassword ? '***' : 'null');

  if (urlUsername && urlPassword) {
    console.log('[Middleware] Found URL credentials, redirecting to auto-login');
    const loginUrl = new URL('/uptime/login', request.url);
    loginUrl.searchParams.set('autoUsername', urlUsername);
    loginUrl.searchParams.set('autoPassword', urlPassword);
    loginUrl.searchParams.set('redirect', pathname);
    console.log('[Middleware] Redirecting to:', loginUrl.toString());
    return NextResponse.redirect(loginUrl);
  }

  // Check for auth token in cookies
  const token = request.cookies.get('auth-token')?.value;
  const allCookies = request.cookies.getAll();

  console.log('[Middleware] All cookies:', allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));
  console.log('[Middleware] Auth token present:', !!token);
  console.log('[Middleware] Auth token length:', token?.length || 0);

  if (!token) {
    console.log('[Middleware] No token found, redirecting to login');
    const loginUrl = new URL('/uptime/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token using jose (edge-compatible)
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    console.log('[Middleware] Token verified successfully');
    console.log('[Middleware] Payload:', { userId: payload.userId, username: payload.username });
    console.log('[Middleware] Authenticated, allowing access');
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] Token verification failed:', error instanceof Error ? error.message : error);
    console.log('[Middleware] Invalid token, redirecting to login');
    const loginUrl = new URL('/uptime/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/|_next/static|_next/image|favicon.ico).*)',
  ],
};
