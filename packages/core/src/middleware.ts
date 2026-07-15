import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkAuthBypass, verifySession } from './lib/auth/authService';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip middleware for static assets, public files, and API endpoints
  // Specifically, ignore next-internal files, static assets (images, favicon, etc.)
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') || // static files like favicon.ico, images, etc.
    pathname.startsWith('/api/auth') // let auth API routes pass through
  ) {
    return NextResponse.next();
  }

  // 2. Read cookies for bypass flag and session token
  const bypassCookie = request.cookies.get('basekit_bypass_auth')?.value;
  const sessionToken = request.cookies.get('basekit_session')?.value;

  const isBypassed = checkAuthBypass(bypassCookie);

  if (isBypassed) {
    // If bypassed, and user tries to access /login, redirect to portal home (/)
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 3. If auth is not bypassed, check for active session
  let isSessionValid = false;
  if (sessionToken) {
    const session = await verifySession(sessionToken);
    if (session) {
      isSessionValid = true;
    }
  }

  if (isSessionValid) {
    // If logged in, and user goes to /login, redirect to portal home (/)
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  } else {
    // If not logged in, and user goes to any page other than /login, redirect to /login
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }
}
