import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://backend-oj36.onrender.com',
});

// Interceptor to inject JWT token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to catch token errors or account disabling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const errMsg = error.response.data?.error || '';
      
      // If unauthorized due to disabled user or expired/invalid token, force logout
      if (
        errMsg.includes('disabled') || 
        errMsg.includes('expired') || 
        errMsg.includes('invalid') || 
        errMsg.includes('no longer exists')
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Dispatch custom event to let AuthContext know to reset state
        window.dispatchEvent(new Event('auth-logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
