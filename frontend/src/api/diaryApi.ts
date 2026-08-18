import { apiClient } from './client';
import { DiaryEntry, DiaryCreateInput } from '../types';

export const diaryApi = {
  getDiaryEntries: async (params?: {
    start_date?: string;
    end_date?: string;
    mood?: string;
    limit?: number;
    offset?: number;
  }): Promise<DiaryEntry[]> => {
    const res = await apiClient.get<DiaryEntry[]>('/diary', { params });
    return res.data;
  },

  getDiaryByDate: async (dateStr: string): Promise<DiaryEntry> => {
    const res = await apiClient.get<DiaryEntry>(`/diary/date/${dateStr}`);
    return res.data;
  },

  saveDiaryEntry: async (entry: DiaryCreateInput): Promise<DiaryEntry> => {
    const res = await apiClient.post<DiaryEntry>('/diary', entry);
    return res.data;
  },

  updateDiaryEntry: async (id: number, updates: Partial<DiaryCreateInput>): Promise<DiaryEntry> => {
    const res = await apiClient.put<DiaryEntry>(`/diary/${id}`, updates);
    return res.data;
  },

  deleteDiaryEntry: async (id: number): Promise<void> => {
    await apiClient.delete(`/diary/${id}`);
  }
};
