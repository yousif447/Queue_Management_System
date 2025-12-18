import { NextResponse } from 'next/server';

// IMPORTANT: Cross-origin cookie authentication doesn't work reliably with Next.js Edge Middleware
// when frontend (Vercel) and backend (b4a.run) are on different domains.
// The cookies set by the backend are third-party cookies that can't be accessed by the middleware.
// 
// Solution: Auth protection is handled client-side in each protected page component.
// This middleware is kept minimal to avoid redirect loops.

export async function middleware(request) {
  // Just pass through all requests - auth is handled client-side
  return NextResponse.next();
}

export const config = {
  matcher: ['/adminDashboard/:path*', '/business/:path*', '/user/:path*'],
};
