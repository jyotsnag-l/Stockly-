/**
 * Centralized API Client for backend communication.
 * Connects to the Express backend via the configured Vite proxy (/api -> http://localhost:5000).
 */

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return '/api';
  if (typeof window !== 'undefined' && window.location.origin.includes('vercel.app')) {
    return `${window.location.origin}/api`;
  }
  return 'https://stockly-backend-7rik.onrender.com';
};

const API_BASE = getApiBaseUrl();

export async function fetchFromApi<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const token = localStorage.getItem('erp_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options?.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
