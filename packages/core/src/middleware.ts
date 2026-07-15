import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkAuthBypass, verifySession } from './lib/auth/authService';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip middleware for static assets, public files, and API endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') || // static files like favicon.ico, images, etc.
    pathname.startsWith('/api/') // let DB API, auth API, AI API pass through
  ) {
    return NextResponse.next();
  }

  // 2. Check disclaimer consent cookie
  const disclaimerAccepted = request.cookies.get('basekit_disclaimer_accepted')?.value === 'true';

  if (pathname === '/disclaimer') {
    if (disclaimerAccepted) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!disclaimerAccepted) {
    return NextResponse.redirect(new URL('/disclaimer', request.url));
  }

  // 3. Read cookies for bypass flag and session token
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

  // 4. If auth is not bypassed, check for active session
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
