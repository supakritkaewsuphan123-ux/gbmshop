import axios from 'axios';

let baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  // If on Netlify, fallback to predicted Render URL
  if (window.location.hostname.includes('netlify.app')) {
    baseURL = 'https://gb-marketplace.onrender.com/api';
    console.warn(`[API] No VITE_API_BASE_URL found on Netlify. Falling back to: ${baseURL}`);
  } else {
    baseURL = '/api';
  }
}

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
