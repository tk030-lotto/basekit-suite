import { UserSessionContext } from '../../types';

const SECRET_KEY = process.env.SESSION_SECRET || 'basekit_default_secret_key_for_development';

// Standard HMAC SHA-256 using Web Crypto API for server/middleware compatibility
async function getCryptoKey() {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Creates a signed token string containing the session data.
 */
export async function signSession(session: UserSessionContext): Promise<string> {
  const enc = new TextEncoder();
  const payloadStr = JSON.stringify(session);
  const key = await getCryptoKey();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(payloadStr)
  );

  const sigArray = Array.from(new Uint8Array(signature));
  const sigHex = sigArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Use standard base64 encoding (Next.js server-safe)
  const payloadBase64 = Buffer.from(payloadStr).toString('base64');

  return `${payloadBase64}.${sigHex}`;
}

/**
 * Verifies the signed token and returns the session payload, or null if invalid.
 */
export async function verifySession(token: string): Promise<UserSessionContext | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadBase64, sigHex] = parts;

    const payloadStr = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const key = await getCryptoKey();
    const enc = new TextEncoder();

    // Convert sigHex back to Uint8Array
    const hexMatch = sigHex.match(/.{1,2}/g);
    if (!hexMatch) return null;
    const sigBytes = new Uint8Array(
      hexMatch.map(byte => parseInt(byte, 16))
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      enc.encode(payloadStr)
    );

    if (!isValid) return null;

    const session = JSON.parse(payloadStr) as UserSessionContext;
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      return null; // Expired
    }
    return session;
  } catch (e) {
    console.error('[verifySession] Error during verification:', e);
    return null;
  }
}

/**
 * Dummy administrator session for bypass.
 */
export const DUMMY_ADMIN_SESSION: UserSessionContext = {
  userId: 'admin-bypass',
  email: 'admin@basekit.local',
  isSystemAdmin: true,
  pluginRoles: {
    'personal-ops': 'MANAGER',
    'bookkeeping': 'MANAGER',
    'sns': 'MANAGER'
  },
  expiresAt: null
};

/**
 * Checks if authentication is currently bypassed.
 * Order of priority:
 * 1. env NEXT_PUBLIC_DISABLE_AUTH === 'true' (bypassed) or === 'false' (enforced)
 * 2. cookie basekit_bypass_auth === 'true' (bypassed) or === 'false' (enforced)
 * 3. Default fallback (true, to preserve 0-yen dev out-of-box experience)
 */
export function checkAuthBypass(cookieVal?: string | null): boolean {
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
    return true;
  }
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'false') {
    return false;
  }

  if (cookieVal === 'true') {
    return true;
  }
  if (cookieVal === 'false') {
    return false;
  }

  return true; // default bypass
}
