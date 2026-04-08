import axios from 'axios';

let baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL || baseURL === '/api') {
  const isNetlify = window.location.hostname.includes('netlify.app');
  const isRender = window.location.hostname.includes('onrender.com');
  
  if (isNetlify || isRender) {
    // Dynamically use the current origin to avoid hardcoded URL mismatches
    baseURL = window.location.origin + '/api';
  } else {
    baseURL = 'http://localhost:3000/api';
  }
}

// Clean up: ensure no double slashes at the end
baseURL = baseURL.replace(/\/$/, '');

console.log(`[API] Base URL initialized: ${baseURL}`);

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error || err.message || 'เกิดข้อผิดพลาด';
    return Promise.reject(new Error(message));
  }
);

export default api;
