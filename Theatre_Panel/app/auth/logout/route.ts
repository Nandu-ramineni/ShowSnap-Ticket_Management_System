import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAMES, SECURE_COOKIE_BASE } from '@/lib/cookies';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function POST(request: NextRequest) {
  try {
    // Read refresh token from httpOnly cookie to invalidate it on the backend
    const refreshToken = request.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

    if (refreshToken) {
      // Best-effort — don't block logout if the backend is unreachable
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }

    const response = NextResponse.json({ success: true });

    // Delete all three cookies — only the server can delete httpOnly ones
    const deleteOptions = {
      ...SECURE_COOKIE_BASE,
      maxAge: 0,
    };

    response.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, '', deleteOptions);
    response.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, '', deleteOptions);
    response.cookies.set(COOKIE_NAMES.USER, '', {
      ...deleteOptions,
      httpOnly: false,
    });

    return response;
  } catch (err) {
    console.error('[/api/auth/logout]', err);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}
