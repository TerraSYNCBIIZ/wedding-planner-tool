/**
 * Check if the user has already completed the setup wizard
 * This checks both localStorage and cookies for evidence that a user has completed setup
 */
export const hasCompletedSetup = (): boolean => {
  if (typeof window === 'undefined') {
    return false; // We're on the server
  }
  
  // First check if there's a cookie indicating setup completion
  const hasSetupCookie = document.cookie.includes('hasCompletedSetup=true');
  
  // Also check if there's a wedding ID in cookies or localStorage
  const hasWeddingIdCookie = document.cookie.includes('currentWeddingId=');
  const weddingId = localStorage.getItem('currentWeddingId');
  
  // Debug info
  console.log('hasCompletedSetup check:', { 
    hasSetupCookie,
    hasWeddingIdCookie,
    weddingId,
    cookies: document.cookie
  });
  
  // If any of these are true, consider setup as completed
  return hasSetupCookie || hasWeddingIdCookie || Boolean(weddingId);
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