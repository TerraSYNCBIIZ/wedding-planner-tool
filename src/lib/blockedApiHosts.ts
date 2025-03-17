// This file contains a list of API hosts that should be blocked
// and functions to intercept and block unwanted API calls

// List of blocked hosts
export const BLOCKED_API_HOSTS = [
  'execute-api.us-east-2.amazonaws.com',
  'sfd8q2ch3k.execute-api.us-east-2.amazonaws.com'
];

// Function to initialize fetch API interceptor
export function initApiBlocker() {
  if (typeof window !== 'undefined') {
    // Store the original fetch function
    const originalFetch = window.fetch;
    
    // Override fetch to block requests to unwanted hosts
    window.fetch = function(input, init) {
      // Convert input to URL if it's a string
      const url = typeof input === 'string' ? new URL(input, window.location.href) : 
                 input instanceof URL ? input : new URL(input.url, window.location.href);
      
      // Check if the host is in the blocked list
      if (BLOCKED_API_HOSTS.some(host => url.host.includes(host))) {
        console.warn(`Blocked API call to ${url.host} - this endpoint is not used by this application`);
        
        // Return a fake successful response
        return Promise.resolve(new Response(JSON.stringify({
          data: null,
          error: null
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }));
      }
      
      // Otherwise, proceed with the original fetch
      return originalFetch.apply(this, [input, init]);
    };
    
    console.log('API blocker initialized - unwanted API calls will be intercepted');
  }
} 