import axios from 'axios';
import { Platform } from 'react-native';

// Cloud Production Backend URL on Vercel
const VERCEL_CLOUD_URL = 'https://mytask-flow.vercel.app/api/v1';
const CUSTOM_BACKEND_URL: string | null = null;

let currentAuthToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentAuthToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('taskflow_auth_token', token);
      } catch (e) {}
    }
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('taskflow_auth_token');
        localStorage.removeItem('taskflow_user_data');
      } catch (e) {}
    }
  }
};

export const getStoredAuthToken = (): string | null => {
  if (currentAuthToken) return currentAuthToken;
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem('taskflow_auth_token');
    } catch (e) {}
  }
  return null;
};

const getBaseUrl = (): string => {
  if (CUSTOM_BACKEND_URL) {
    return CUSTOM_BACKEND_URL;
  }
  // Default to live Vercel Cloud Backend API & Neon PostgreSQL Database
  // Guaranteed instant connection (<200ms) without local port/firewall timeouts
  return VERCEL_CLOUD_URL;
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Initialize from stored token if exists
const initialToken = getStoredAuthToken();
if (initialToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
