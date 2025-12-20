import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Site password (should match middleware)
const SITE_PASSWORD = process.env.ADMIN_SITE_PASSWORD || 'genki-admin-2024';
const COOKIE_NAME = 'admin-site-auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Simple hash for cookie value (must match middleware)
function hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'auth_' + Math.abs(hash).toString(36);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { password } = body;

        if (!password) {
            return NextResponse.json(
                { success: false, message: 'Password is required' },
                { status: 400 }
            );
        }

        if (password !== SITE_PASSWORD) {
            return NextResponse.json(
                { success: false, message: 'Invalid site password' },
                { status: 401 }
            );
        }

        // Password correct - set auth cookie
        const response = NextResponse.json({ success: true });

        response.cookies.set(COOKIE_NAME, hashPassword(SITE_PASSWORD), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Gate auth error:', error);
        return NextResponse.json(
            { success: false, message: 'Authentication failed' },
            { status: 500 }
        );
    }
}
