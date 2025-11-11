/**
 * API utility for making authenticated requests with automatic suspension handling
 */

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Custom fetch wrapper that handles suspension and authentication errors
 */
export async function authenticatedFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const token = localStorage.getItem('accessToken');
  
  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle suspension response
  if (response.status === 403) {
    try {
      const data = await response.json();
      if (data.suspended) {
        // User is suspended - force logout
        console.warn('🚫 User suspended - forcing logout');
        
        // Clear all auth data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        sessionStorage.clear();
        
        // Show alert and reload to login page
        alert(data.message || 'Your account has been suspended. You will be logged out.');
        window.location.href = '/';
        
        // Throw error to prevent further processing
        throw new Error('User suspended');
      }
    } catch (jsonError) {
      // If not JSON or other error, continue normal flow
      if (jsonError instanceof Error && jsonError.message === 'User suspended') {
        throw jsonError;
      }
    }
  }

  return response;
}

/**
 * Helper function to check if a response indicates user suspension
 */
export function handleSuspensionError(error: any, onLogout?: () => void): boolean {
  if (error?.suspended || error?.message === 'User suspended') {
    if (onLogout) {
      onLogout();
    } else {
      // Fallback: force logout by clearing storage and reloading
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.clear();
      window.location.href = '/';
    }
    return true;
  }
  return false;
}
