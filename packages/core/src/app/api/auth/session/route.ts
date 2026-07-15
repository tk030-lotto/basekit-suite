import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
import { checkAuthBypass, verifySession, DUMMY_ADMIN_SESSION } from '../../../../lib/auth/authService';

export async function GET() {
  try {
    const cookieStore = cookies();
    const bypassCookie = cookieStore.get('basekit_bypass_auth')?.value;
    const sessionCookie = cookieStore.get('basekit_session')?.value;

    const isBypassed = checkAuthBypass(bypassCookie);

    if (isBypassed) {
      return NextResponse.json({
        user: DUMMY_ADMIN_SESSION,
        bypassed: true
      });
    }

    if (!sessionCookie) {
      return NextResponse.json({
        user: null,
        bypassed: false
      });
    }

    const session = await verifySession(sessionCookie);
    if (!session) {
      return NextResponse.json({
        user: null,
        bypassed: false
      });
    }

    return NextResponse.json({
      user: session,
      bypassed: false
    });
  } catch (err: any) {
    console.error('[Session API] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
