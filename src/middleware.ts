import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the current path
  const path = request.nextUrl.pathname;
  
  // Check for auth token in cookies - check both formats to ensure compatibility
  const authToken = request.cookies.get('authToken')?.value || request.cookies.get('auth_token')?.value;
  
  // Also check for hasCompletedSetup and currentWorkspaceId cookies
  const hasCompletedSetup = request.cookies.get('hasCompletedSetup')?.value;
  const currentWorkspaceId = request.cookies.get('currentWorkspaceId')?.value;
  
  // Check for migration status
  const needsMigration = request.cookies.get('needsMigration')?.value === 'true';
  
  console.log('Middleware: Processing request', { 
    path, 
    hasAuth: !!authToken,
    hasCompletedSetup: hasCompletedSetup === 'true',
    currentWorkspaceId: currentWorkspaceId || 'none',
    needsMigration: needsMigration
  });
  
  // Skip middleware for static assets and API routes
  if (
    path.startsWith('/_next') || 
    path.includes('/favicon.ico')
  ) {
    return NextResponse.next();
  }
  
  // Public routes that don't require auth
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/invitation/accept'];
  
  // Routes that don't require migration
  const migrationExemptRoutes = [...publicRoutes, '/migration', '/api'];
  
  // If user needs migration and is not on an exempt route, redirect to migration page
  if (needsMigration && authToken && !migrationExemptRoutes.some(route => path.startsWith(route))) {
    console.log('Middleware: Redirecting user to migration page');
    return NextResponse.redirect(new URL('/migration', request.url));
  }
  
  // Setup wizard special handling
  if (path === '/setup-wizard') {
    // If user is not authenticated, redirect to login
    if (!authToken) {
      console.log('Middleware: Redirecting unauthenticated user from setup wizard to login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // If user has completed setup, redirect to home/dashboard
    if (hasCompletedSetup === 'true' && currentWorkspaceId) {
      console.log('Middleware: User has completed setup, redirecting from setup wizard to dashboard');
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Otherwise, allow access to setup wizard
    return NextResponse.next();
  }
  
  // Specifically protect the workspace creation route
  // Users must complete the setup wizard before creating additional workspaces
  if (path === '/workspaces/create') {
    // If user is not authenticated, redirect to login
    if (!authToken) {
      console.log('Middleware: Redirecting unauthenticated user from workspace creation to login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // If user has not completed setup, redirect to setup wizard
    if (hasCompletedSetup !== 'true') {
      console.log('Middleware: Redirecting user who has not completed setup from workspace creation to setup wizard');
      return NextResponse.redirect(new URL('/setup-wizard', request.url));
    }
    
    // Otherwise, allow access to workspace creation
    return NextResponse.next();
  }
  
  // For public routes, if the user is authenticated and has completed setup, redirect to home
  if (publicRoutes.includes(path) && authToken && hasCompletedSetup === 'true') {
    console.log('Middleware: Redirecting authenticated user from public route to dashboard');
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // For public routes, allow access without auth
  if (publicRoutes.includes(path)) {
    return NextResponse.next();
  }
  
  // Allow API routes to function without redirects, but they'll need their own auth checks
  if (path.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Check if the user is logged in for protected routes
  if (!authToken) {
    console.log('Middleware: Redirecting unauthenticated user to login');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // For all non-setup-wizard routes, check if setup is completed
  if (path !== '/setup-wizard' && hasCompletedSetup !== 'true') {
    console.log('Middleware: Redirecting user who has not completed setup to setup wizard');
    return NextResponse.redirect(new URL('/setup-wizard', request.url));
  }
  
  // Allow access to all other routes
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all routes except static files and specific excluded paths
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 