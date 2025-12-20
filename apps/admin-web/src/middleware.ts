import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Site password for admin access (set in environment variable)
const SITE_PASSWORD = process.env.ADMIN_SITE_PASSWORD || 'genki-admin-2024';
const COOKIE_NAME = 'admin-site-auth';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow access to the gate page and its API
    if (pathname === '/gate' || pathname === '/api/auth/gate') {
        return NextResponse.next();
    }

    // Allow static files and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Check for valid site auth cookie
    const authCookie = request.cookies.get(COOKIE_NAME);

    if (!authCookie || authCookie.value !== hashPassword(SITE_PASSWORD)) {
        // Redirect to password gate
        const url = request.nextUrl.clone();
        url.pathname = '/gate';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// Simple hash for cookie value (not cryptographic, just obfuscation)
function hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'auth_' + Math.abs(hash).toString(36);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
