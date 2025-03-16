/**
 * Check if the user has already completed the setup wizard
 * This is a temporary implementation that will be replaced with proper
 * authentication in Phase 2
 */
export const hasCompletedSetup = (): boolean => {
  if (typeof window === 'undefined') {
    return false; // We're on the server
  }
  
  // Check if there's a wedding ID in local storage
  const weddingId = localStorage.getItem('currentWeddingId');
  return Boolean(weddingId);
};

/**
 * Get the current wedding ID
 * This is a temporary implementation that will be replaced with proper
 * authentication in Phase 2
 */
export const getCurrentWeddingId = (): string | null => {
  if (typeof window === 'undefined') {
    return null; // We're on the server
  }
  
  return localStorage.getItem('currentWeddingId');
}; 