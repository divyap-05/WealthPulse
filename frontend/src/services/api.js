const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Transport HTTP-only cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'An error occurred while communicating with the server.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
