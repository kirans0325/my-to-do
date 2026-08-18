import axios from 'axios';
import { Platform } from 'react-native';

// 💡 TIP: When installing the APK on your physical Android phone:
// If running FastAPI on your computer, set your computer's Wi-Fi IP address below (e.g. 'http://192.168.1.15:8000/api/v1')
// If backend is deployed to cloud (Render, Railway, Fly.io), set your cloud URL.
const CUSTOM_BACKEND_URL: string | null = null; // e.g. "http://192.168.1.15:8000/api/v1"

const getBaseUrl = (): string => {
  if (CUSTOM_BACKEND_URL) {
    return CUSTOM_BACKEND_URL;
  }

  if (Platform.OS === 'web') {
    // In web browser
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return `http://${window.location.hostname}:8000/api/v1`;
    }
    return 'http://localhost:8000/api/v1';
  } else if (Platform.OS === 'android') {
    // In Android Mobile connected via Hotspot (Your laptop's hotspot IP is 10.130.151.61)
    return 'http://10.130.151.61:8000/api/v1';
  }
  return 'http://localhost:8000/api/v1';
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
