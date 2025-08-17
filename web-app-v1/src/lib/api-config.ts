// API configuration for backend connections
export const API_CONFIG = {
  // Backend API base URL - update this to your actual backend server
  BACKEND_BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  
  // API endpoints
  ENDPOINTS: {
    USER_NEW: '/api/v1/user_new',
    SEARCH_CHANNELS: '/api/v1/user_new/search-channels',
    SEARCH_CHANNELS_BY_PRIVY: '/api/v1/user_new/search-channels-by-privy',
    CHECK_CHANNEL_CONFLICT: '/api/v1/user_new/{user_id}/check-channel-conflict',
    CONNECT_CHANNEL: '/api/v1/user_new/{user_id}/connect-channel'
  },
  
  // Request configuration
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  TIMEOUT: 30000 // 30 seconds
};

// Helper function to build full URL
export function buildApiUrl(endpoint: string, params?: Record<string, string>): string {
  let url = `${API_CONFIG.BACKEND_BASE_URL}${endpoint}`;
  
  // Replace path parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value);
    });
  }
  
  return url;
}

// Helper function for making API requests
export async function makeApiRequest(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const config: RequestInit = {
    ...options,
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...options.headers
    }
  };

  console.log(`Making API request to: ${url}`, {
    method: config.method || 'GET',
    headers: config.headers
  });

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response;
}
