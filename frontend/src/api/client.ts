import axios from 'axios';
import { Platform } from 'react-native';

// Dynamically determine the backend base URL
const getBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    // In web browser
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return `http://${window.location.hostname}:8000/api/v1`;
    }
    return 'http://localhost:8000/api/v1';
  } else if (Platform.OS === 'android') {
    // In Android Emulator or Physical Device
    // For emulator use 10.0.2.2, for physical device change to your LAN IP (e.g. 192.168.1.x)
    return 'http://10.0.2.2:8000/api/v1';
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
