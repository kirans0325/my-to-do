import { apiClient, setAuthToken } from './client';
import { AuthResponse, LoginInput, RegisterInput, User, FamilyUserSummary } from '../types';

export const authApi = {
  login: async (payload: LoginInput): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', payload);
    if (res.data.access_token) {
      setAuthToken(res.data.access_token);
    }
    return res.data;
  },

  register: async (payload: RegisterInput): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', payload);
    if (res.data.access_token) {
      setAuthToken(res.data.access_token);
    }
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  getFamilyUsers: async (): Promise<FamilyUserSummary[]> => {
    const res = await apiClient.get<FamilyUserSummary[]>('/auth/users');
    return res.data;
  },
};
