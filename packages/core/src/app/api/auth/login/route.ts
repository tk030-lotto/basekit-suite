import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
import { signSession } from '../../../../lib/auth/authService';
import { UserSessionContext } from '../../../../types';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Enforce basic local admin credentials for zero-setup ease
    const expectedEmail = 'admin@basekit.local';
    const expectedPassword = 'password';

    if (email !== expectedEmail || password !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスまたはパスワードが正しくありません。' },
        { status: 401 }
      );
    }

    // Generate user session context (expires in 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const session: UserSessionContext = {
      userId: 'admin-user',
      email: expectedEmail,
      isSystemAdmin: true,
      pluginRoles: {
        'personal-ops': 'MANAGER',
        'bookkeeping': 'MANAGER',
        'sns': 'MANAGER'
      },
      expiresAt
    };

    const token = await signSession(session);

    // Set cookie
    const cookieStore = cookies();
    cookieStore.set('basekit_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return NextResponse.json({ success: true, user: session });
  } catch (err: any) {
    console.error('[Login API] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
