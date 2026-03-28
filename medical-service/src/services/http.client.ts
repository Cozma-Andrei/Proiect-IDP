import axios from 'axios';

const RECORDS_URL = process.env.RECORDS_SERVICE_URL || 'http://localhost:5003';
const IO_URL = process.env.IO_SERVICE_URL || 'http://localhost:5004';
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';

export const recordsApi = axios.create({
  baseURL: RECORDS_URL,
  timeout: 10000,
});

export const ioApi = axios.create({
  baseURL: IO_URL,
  timeout: 30000, // longer timeout for file operations
});

export const authApi = axios.create({
  baseURL: AUTH_URL,
  timeout: 5000,
});
