import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const cookieStore = cookies();
    cookieStore.set('basekit_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 // clear immediately
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Logout API] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
