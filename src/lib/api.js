import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:5001';
console.log('baseurl', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
