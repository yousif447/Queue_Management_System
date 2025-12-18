import { NextResponse } from 'next/server';

// List of protected routes that require authentication
const protectedRoutes = [
  '/adminDashboard',
  '/business',
  '/user'
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    try {
      // Check authentication by calling the API
      const response = await fetch('http://localhost:5000/api/v1/auth/me', {
        method: 'GET',
        headers: {
          'Cookie': request.headers.get('cookie') || '',
        },
      });

      if (!response.ok) {
        // Not authenticated, redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const data = await response.json();

      // Check role-based access
      if (pathname.startsWith('/adminDashboard') && data.data?.role !== 'admin') {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (pathname.startsWith('/business') && data.data?.role !== 'business') {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (pathname.startsWith('/user') && data.data?.role !== 'user') {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Middleware error:', error);
      // On error, redirect to login to be safe
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/adminDashboard/:path*', '/business/:path*', '/user/:path*'],
};
