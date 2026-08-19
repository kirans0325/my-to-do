import axios from 'axios';
import { Platform } from 'react-native';

// 💡 TIP: When installing the APK on your physical Android phone:
// If running FastAPI on your computer, set your computer's Wi-Fi IP address below (e.g. 'http://192.168.1.15:8000/api/v1')
// If backend is deployed to cloud (Render, Railway, Fly.io), set your cloud URL.
// Cloud Production Backend URL on Vercel
const VERCEL_CLOUD_URL = 'https://mytask-flow.vercel.app/api/v1';
const CUSTOM_BACKEND_URL: string | null = null;

const getBaseUrl = (): string => {
  if (CUSTOM_BACKEND_URL) {
    return CUSTOM_BACKEND_URL;
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      // In local development web browser on port 8081 / 19006 / 3000
      if (window.location.port === '8081' || window.location.port === '19006' || window.location.port === '3000') {
        if (window.location.hostname) {
          return `http://${window.location.hostname}:8000/api/v1`;
        }
      }
      // In Vercel / Production web hosting (same origin /api/v1)
      return `${window.location.origin}/api/v1`;
    }
    return VERCEL_CLOUD_URL;
  } else if (Platform.OS === 'android' || Platform.OS === 'ios') {
    // In Android APK or iOS: Connect directly to your live Vercel Cloud Backend & Neon DB
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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
