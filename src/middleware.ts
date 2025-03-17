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
  const currentWeddingId = request.cookies.get('currentWeddingId')?.value;
  
  // Check if user has a valid workspace/wedding ID from any source
  // If they do, they should be considered as having completed setup
  const userHasCompletedSetup = 
    hasCompletedSetup === 'true' || 
    !!currentWorkspaceId || 
    !!currentWeddingId;
  
  // Debug info for setup state
  const setupState = {
    hasCompletedSetup,
    currentWorkspaceId,
    currentWeddingId,
    userHasCompletedSetup
  };
  
  // Check for migration status
  const needsMigration = request.cookies.get('needsMigration')?.value === 'true';
  
  // Check for invitation token in the URL
  const invitationToken = request.nextUrl.searchParams.get('token');
  
  // Skip middleware for static assets, API routes, and Next.js internals
  if (
    path.startsWith('/_next') || 
    path.includes('/favicon.ico') ||
    path.includes('/__nextjs_') ||
    path.includes('/_vercel') ||
    path.startsWith('/api') ||  // Skip all API routes
    path.includes('.') || // Skip files with extensions (.js, .css, etc.)
    request.nextUrl.host.includes('execute-api') // Skip AWS API Gateway calls
  ) {
    return NextResponse.next();
  }
  
  console.log('Middleware: Processing request', { 
    path, 
    hasAuth: !!authToken,
    hasCompletedSetup: userHasCompletedSetup,
    currentWorkspaceId: currentWorkspaceId || 'none',
    currentWeddingId: currentWeddingId || 'none',
    setupState,
    needsMigration: needsMigration,
    hasInvitationToken: !!invitationToken
  });
  
  // Public routes that don't require auth
  const publicRoutes = ['/landing', '/auth/login', '/auth/signup', '/auth/forgot-password', '/invitation/accept'];
  
  // Check if current path matches any public route
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(`${route}/`));
  
  // Routes that don't require migration
  const migrationExemptRoutes = [...publicRoutes, '/migration', '/api'];
  
  // If user needs migration and is not on an exempt route, redirect to migration page
  if (needsMigration && authToken && !migrationExemptRoutes.some(route => path.startsWith(route))) {
    console.log('Middleware: Redirecting user to migration page');
    return NextResponse.redirect(new URL('/migration', request.url));
  }
  
  // Special handling for invitation acceptance
  if (path === '/invitation/accept' || invitationToken) {
    console.log('Middleware: Handling invitation flow');
    
    // If user is not authenticated, redirect to login with the token
    if (!authToken && path !== '/auth/login' && path !== '/auth/signup') {
      console.log('Middleware: Redirecting unauthenticated user to login with invitation token');
      const loginUrl = new URL('/auth/login', request.url);
      if (invitationToken) {
        loginUrl.searchParams.set('redirect', '/invitation/accept');
        loginUrl.searchParams.set('token', invitationToken);
      }
      return NextResponse.redirect(loginUrl);
    }
    
    // If user is authenticated and on the invitation acceptance page, allow them to proceed
    // even if they haven't completed setup
    if (authToken && path === '/invitation/accept') {
      console.log('Middleware: Allowing authenticated user to access invitation acceptance page');
      return NextResponse.next();
    }
  }
  
  // Setup wizard special handling
  if (path === '/setup-wizard') {
    // If user is not authenticated, redirect to login
    if (!authToken) {
      console.log('Middleware: Redirecting unauthenticated user from setup wizard to login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // Check if there's an invitation token in the URL
    // If there is, redirect to the invitation acceptance page
    if (invitationToken) {
      console.log('Middleware: Redirecting from setup wizard to invitation acceptance page');
      return NextResponse.redirect(new URL(`/invitation/accept?token=${invitationToken}`, request.url));
    }
    
    // If user has completed setup or has a workspace, redirect to home/dashboard
    if (userHasCompletedSetup) {
      console.log('Middleware: User has completed setup or has a workspace, redirecting from setup wizard to dashboard');
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
    
    // If user has not completed setup and has no workspace, redirect to setup wizard
    if (!userHasCompletedSetup) {
      console.log('Middleware: Redirecting user who has not completed setup from workspace creation to setup wizard');
      return NextResponse.redirect(new URL('/setup-wizard', request.url));
    }
    
    // Otherwise, allow access to workspace creation
    return NextResponse.next();
  }
  
  // For public routes, if the user is authenticated and has completed setup, redirect to home
  // EXCEPT for the invitation acceptance route
  if (isPublicRoute && authToken && userHasCompletedSetup && path !== '/invitation/accept') {
    console.log('Middleware: Redirecting authenticated user from public route to dashboard');
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // For public routes, allow access without auth
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For all other routes, require authentication
  if (!authToken) {
    console.log('Middleware: Redirecting unauthenticated user to login');
    
    // Store the current URL to redirect back after login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    
    return NextResponse.redirect(loginUrl);
  }
  
  // For authenticated users who haven't completed setup, redirect to setup wizard
  // EXCEPT if they're accessing the invitation acceptance page
  if (!userHasCompletedSetup && path !== '/invitation/accept') {
    // Check if there's an invitation token in the URL
    // If there is, redirect to the invitation acceptance page
    if (invitationToken) {
      console.log('Middleware: Redirecting to invitation acceptance page');
      return NextResponse.redirect(new URL(`/invitation/accept?token=${invitationToken}`, request.url));
    }
    
    console.log('Middleware: Redirecting user who has not completed setup to setup wizard');
    return NextResponse.redirect(new URL('/setup-wizard', request.url));
  }
  
  // Allow access to all other routes for authenticated users who have completed setup
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 