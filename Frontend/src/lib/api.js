// API configuration - uses environment variable or falls back to localhost for development
// In Vercel: Set NEXT_PUBLIC_API_URL = https://your-backend-url.b4a.run
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function to get full API URL
export const getApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${API_URL}${cleanPath}`;
};

// Helper function to get auth headers (reads token from localStorage)
export const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Authenticated fetch helper - automatically includes Authorization header
// Use this for all authenticated API calls
export const authFetch = (url, options = {}) => {
  const authHeaders = getAuthHeaders();
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
};
