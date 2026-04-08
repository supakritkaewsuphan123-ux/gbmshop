import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
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
