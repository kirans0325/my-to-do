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

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      const host = window.location.hostname;
      // In local development web browser on any port or local network IP
      if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
        return `http://${host}:8000/api/v1`;
      }
      // Production web app or Vercel hosting
      return VERCEL_CLOUD_URL;
    }
    return VERCEL_CLOUD_URL;
  } else if (Platform.OS === 'android' || Platform.OS === 'ios') {
    // In Android APK or iOS: Connect directly to live Vercel Cloud Backend & Neon DB
    return VERCEL_CLOUD_URL;
  }
  return VERCEL_CLOUD_URL;
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
