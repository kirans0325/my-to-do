import { apiClient, setAuthToken } from './client';
import {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
  FamilyUserSummary,
  AdminAnalyticsSummary,
} from '../types';

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

  getAdminAnalytics: async (): Promise<AdminAnalyticsSummary> => {
    const res = await apiClient.get<AdminAnalyticsSummary>('/auth/admin-analytics');
    return res.data;
  },

  resetUserPassword: async (userId: number, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      `/auth/users/${userId}/reset-password`,
      { new_password: newPassword }
    );
    return res.data;
  },

  deleteUser: async (userId: number): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/auth/users/${userId}`);
    return res.data;
  },
};
