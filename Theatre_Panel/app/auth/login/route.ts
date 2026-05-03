import { NextRequest, NextResponse } from 'next/server';
import {
  COOKIE_NAMES,
  SECURE_COOKIE_BASE,
  COOKIE_MAX_AGE,
} from '@/lib/cookies';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward credentials to your backend
    const backendRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    if (!backendRes.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Login failed' },
        { status: backendRes.status }
      );
    }

    const { user, accessToken, refreshToken } = data.data;

    const response = NextResponse.json({
      success: true,
      message: data.message,
      user, // send user back so Redux can hydrate without reading cookies
    });

    // ── httpOnly — tokens are invisible to JS ────────────────────────────────
    response.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      ...SECURE_COOKIE_BASE,
      maxAge: COOKIE_MAX_AGE.ACCESS_TOKEN,
    });

    response.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...SECURE_COOKIE_BASE,
      maxAge: COOKIE_MAX_AGE.REFRESH_TOKEN,
    });

    // ── NOT httpOnly — client reads this to rehydrate Redux on page load ─────
    response.cookies.set(
      COOKIE_NAMES.USER,
      encodeURIComponent(JSON.stringify(user)),
      {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE.USER,
      }
    );

    return response;
  } catch (err) {
    console.error('[/api/auth/login]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
