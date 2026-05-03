/**
 * Cookie helpers — single source of truth for all auth cookie operations.
 *
 * Token strategy:
 *   accessToken  → httpOnly flag cannot be set from JS. We set it as Secure,
 *                  SameSite=Strict with a short max-age. For true httpOnly you
 *                  need a server endpoint — see /api/auth/login route handler.
 *
 * We store:
 *   ss_access  → accessToken  (short-lived, 1 day)
 *   ss_refresh → refreshToken (long-lived, 30 days)
 *   ss_user    → serialized UserData JSON (30 days) — used to rehydrate Redux
 */

export const COOKIE = {
  ACCESS: 'ss_access',
  REFRESH: 'ss_refresh',
  USER: 'ss_user',
} as const;

const isProd = process.env.NODE_ENV === 'production';

function buildCookieString(
  name: string,
  value: string,
  maxAge: number,
  httpOnly = false
): string {
  let cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Strict`;
  if (isProd) cookie += '; Secure';
  if (httpOnly) cookie += '; HttpOnly';
  return cookie;
}

/** Write all three auth cookies after a successful login */
export function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  user: object
): void {
  if (typeof document === 'undefined') return;
  document.cookie = buildCookieString(COOKIE.ACCESS, accessToken, 60 * 60 * 24);        // 1 day
  document.cookie = buildCookieString(COOKIE.REFRESH, refreshToken, 60 * 60 * 24 * 30); // 30 days
  document.cookie = buildCookieString(COOKIE.USER, JSON.stringify(user), 60 * 60 * 24 * 30);
}

/** Clear all auth cookies (set maxAge=0) */
export function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;
  [COOKIE.ACCESS, COOKIE.REFRESH, COOKIE.USER].forEach((name) => {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Strict${isProd ? '; Secure' : ''}`;
  });
}

/** Read a single cookie by name — returns null if absent */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split('=').slice(1).join('='));
}

/** Parse the user cookie into an object — returns null on any failure */
export function getUserFromCookie<T = Record<string, unknown>>(): T | null {
  try {
    const raw = getCookie(COOKIE.USER);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
