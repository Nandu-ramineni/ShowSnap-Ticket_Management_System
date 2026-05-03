import { NextRequest, NextResponse } from 'next/server';
import { COOKIE } from '@/lib/cookies';

const PUBLIC_PATHS = ['/login', '/signup', '/api/auth/login', '/api/auth/logout'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths and static assets through
    const isPublic =
        PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.match(/\.(png|svg|jpg|ico|webp)$/);

    if (isPublic) return NextResponse.next();

    const token = request.cookies.get(COOKIE.ACCESS)?.value;

    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT:
         * - _next/static, _next/image (Next.js internals)
         * - favicon.ico
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
