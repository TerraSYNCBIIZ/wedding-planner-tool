import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the path
  const path = request.nextUrl.pathname;
  
  // Skip middleware for the auth pages, setup wizard, API routes, and static assets
  if (
    path.startsWith('/auth') || 
    path.startsWith('/setup-wizard') || 
    path.startsWith('/api') || 
    path.startsWith('/_next') || 
    path.includes('/favicon.ico')
  ) {
    return NextResponse.next();
  }
  
  // Check for authentication token in cookies
  const authToken = request.cookies.get('auth_token')?.value;
  const hasCompletedSetup = request.cookies.get('hasCompletedSetup')?.value === 'true';
  
  // If user is not authenticated, redirect to login
  if (!authToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // If user is authenticated but hasn't completed setup, redirect to setup wizard
  if (authToken && !hasCompletedSetup) {
    return NextResponse.redirect(new URL('/setup-wizard', request.url));
  }
  
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all routes except static files and specific excluded paths
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 