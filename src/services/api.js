import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token found:', token); // Debug log
    } else {
      console.log('No token found'); // Debug log
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Authentication error detected'); // Debug log
      Cookies.remove('token');
      Cookies.remove('userInfo');
      window.location.href = '/?error=unauthorized';
    }
    return Promise.reject(error);
  }
);

export default api;
