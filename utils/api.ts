// API base URL from environment variables
export const API_BASE_URL = "https://one-stay-server-e4p3.onrender.com//api";

// Default headers for API requests
export const defaultHeaders = {
  'Content-Type': 'application/json',
};

// Helper function to get headers with auth token
export const getAuthHeaders = async () => {
  const { getToken } = await import('./auth');
  const token = await getToken();
  
  return {
    ...defaultHeaders,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic API request function
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Request failed: ${endpoint}`, error);
    throw error;
  }
};

// Authenticated API request function
export const authenticatedApiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const headers = await getAuthHeaders();
  
  return apiRequest(endpoint, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
};