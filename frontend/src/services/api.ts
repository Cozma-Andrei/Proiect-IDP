import axios from 'axios';

const KONG_GATEWAY_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: KONG_GATEWAY_URL
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
