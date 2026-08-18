import { apiClient } from './client';
import { OverviewStats } from '../types';

export const statsApi = {
  getOverviewStats: async (): Promise<OverviewStats> => {
    const res = await apiClient.get<OverviewStats>('/stats/overview');
    return res.data;
  }
};
