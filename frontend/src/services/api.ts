import axios from 'axios';

const AUTH_SERVICE_URL = 'http://localhost:5001';
const MEDICAL_SERVICE_URL = 'http://localhost:5002';

const api = axios.create();

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Route requests to the appropriate microservice
  const url = config.url || '';
  if (url.startsWith('/auth') || url.startsWith('/confirm') || url.startsWith('/admin')) {
    config.baseURL = AUTH_SERVICE_URL;
  } else {
    config.baseURL = MEDICAL_SERVICE_URL;
  }

  return config;
});

export default api;
