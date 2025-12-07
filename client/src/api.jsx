import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API = axios.create({
baseURL: `${API_URL}/api`,
  timeout: 10000,
});
let authToken = null;
export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete API.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}
// }
API.interceptors.request.use(
  (config) => {
    const freshToken = localStorage.getItem('token');
    
    if (freshToken) {
      config.headers.Authorization = `Bearer ${freshToken}`;
    } else if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    // console.log(`API Response ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message
    });
    
    if (error.response?.status === 401) {
      console.log('Authentication failed, clearing token...');
      setAuthToken(null);
      localStorage.removeItem('user');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;