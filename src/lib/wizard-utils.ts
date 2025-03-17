/**
 * Check if the user has already completed the setup wizard
 * This checks both localStorage and cookies for evidence that a user has completed setup
 * 
 * If an invitation token is present, we'll bypass this check to allow the invitation flow to complete
 */
export const hasCompletedSetup = (): boolean => {
  if (typeof window === 'undefined') {
    return false; // We're on the server
  }
  
  // Check if there's an invitation token in session storage
  // If there is, we want to bypass the setup wizard to allow the invitation flow to complete
  const invitationToken = sessionStorage.getItem('invitationToken');
  if (invitationToken) {
    console.log('Invitation token found in session storage, bypassing hasCompletedSetup check');
    return false; // Return false to allow the invitation flow to proceed
  }
  
  // First check if there's a cookie indicating setup completion
  const hasSetupCookie = document.cookie.includes('hasCompletedSetup=true');
  
  // Check for wedding/workspace IDs in cookies or localStorage
  const hasWeddingIdCookie = document.cookie.includes('currentWeddingId=');
  const weddingId = localStorage.getItem('currentWeddingId');
  const hasWorkspaceIdCookie = document.cookie.includes('currentWorkspaceId=');
  const workspaceId = localStorage.getItem('currentWorkspaceId');
  
  // Check if user has any workspaces stored in localStorage
  let hasWorkspaces = false;
  try {
    // Look for any workspace-related data in localStorage that would indicate 
    // the user has existing workspaces
    const keys = Object.keys(localStorage);
    const workspaceKeys = keys.filter(key => 
      key.includes('workspace_') || 
      key.includes('currentWorkspaceId') ||
      key.includes('initialWorkspaceLoadTriggered')
    );
    hasWorkspaces = workspaceKeys.length > 0;
  } catch (e) {
    console.error('Error checking localStorage for workspaces:', e);
  }
  
  // Debug info
  console.log('hasCompletedSetup check:', { 
    hasInvitationToken: !!invitationToken,
    hasSetupCookie,
    hasWeddingIdCookie,
    weddingId,
    hasWorkspaceIdCookie,
    workspaceId,
    hasWorkspaces,
    cookies: document.cookie
  });
  
  // If any of these are true, consider setup as completed
  return hasSetupCookie || 
         hasWeddingIdCookie || 
         Boolean(weddingId) || 
         hasWorkspaceIdCookie || 
         Boolean(workspaceId) ||
         hasWorkspaces;
};

/**
 * Get the current wedding ID
 */
export const getCurrentWeddingId = (): string | null => {
  if (typeof window === 'undefined') {
    return null; // We're on the server
  }
  
  // First try to get from localStorage
  const weddingIdFromStorage = localStorage.getItem('currentWeddingId');
  
  // If not in localStorage, try to get from cookie
  if (!weddingIdFromStorage) {
    const cookieMatch = document.cookie.match(/currentWeddingId=([^;]+)/);
    if (cookieMatch) {
      return cookieMatch[1];
    }
  }
  
  return weddingIdFromStorage;
};

/**
 * Set that the user has completed setup
 */
export const setHasCompletedSetup = (weddingId: string): void => {
  if (typeof window === 'undefined') {
    return; // We're on the server
  }
  
  console.log('Setting user as completed setup with wedding ID:', weddingId);
  
  // Store in localStorage
  localStorage.setItem('currentWeddingId', weddingId);
  
  // Set cookies that will be checked on subsequent requests
  // Use a more secure and complete cookie setting approach
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year from now
  
  // Set hasCompletedSetup cookie
  document.cookie = `hasCompletedSetup=true; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
  
  // Also set the wedding ID in a cookie for middleware access
  document.cookie = `currentWeddingId=${weddingId}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
  
  console.log('Setup completion flags set:', {
    localStorage: localStorage.getItem('currentWeddingId'),
    cookies: document.cookie
  });
}; 