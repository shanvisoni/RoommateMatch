// Centralized configuration for API URLs

// Prioritize VITE_API_URL from .env
// Fallback to REACT_APP_API_URL (legacy)
// Fallback to production URL if in production mode and no env var set
// Default to localhost for development
export const API_URL =
    import.meta.env.VITE_API_URL ||
    import.meta.env.REACT_APP_API_URL ||
    'http://localhost:5000'; // Default for local development

console.log('🔧 Configured API_URL:', API_URL);
