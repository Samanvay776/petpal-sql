const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5005';
export const API_BASE = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
