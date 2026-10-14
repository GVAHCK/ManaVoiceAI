import apiClient from './apiClient';
import type { HistoryResponse, Generation } from '../types';

export const historyService = {
  async getHistory(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    target_language?: string;
    status?: string;
    sort_by?: string;
  }): Promise<HistoryResponse> {
    const res = await apiClient.get<HistoryResponse>('/history', { params });
    return res.data;
  },

  async getHistoryItem(id: string): Promise<Generation> {
    const res = await apiClient.get<Generation>(`/history/${id}`);
    return res.data;
  },

  async deleteHistoryItem(id: string): Promise<void> {
    await apiClient.delete(`/history/${id}`);
  },
};
