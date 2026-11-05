// File: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/jwt-secret';

// Define paths that do NOT require authentication (Must include full API paths!)
const PUBLIC_PATHS = [
  '/login', 
  '/register', 
  '/auth/login', 
  '/auth/register',
  '/api/auth/login', 
  '/api/auth/register', 
  '/api/token'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip authentication for public routes & auth API routes
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2. Extract token from Authorization header or HTTP-only cookie
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : request.cookies.get('token')?.value;

  if (!token) {
    // If it's an API route asking for JSON, return JSON 401 instead of HTML
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Access denied. No token provided.' },
        { status: 401 }
      );
    }
    // Otherwise redirect user to login page for UI pages
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 3. Verify JWT
  let secret: Uint8Array;
  try {
    secret = new TextEncoder().encode(getJwtSecret());
  } catch (error) {
    console.error('JWT authentication is not configured:', error);
    return NextResponse.json(
      { error: 'Authentication is not configured.' },
      { status: 500 }
    );
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    // Forward verified user data to downstream Route Handlers via custom headers
    const requestHeaders = new Headers(request.headers);
    if (payload.userId) {
      requestHeaders.set('x-user-id', String(payload.userId));
    }
    if (payload.role) {
      requestHeaders.set('x-user-role', String(payload.role));
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Invalid or expired token.' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets and images
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};