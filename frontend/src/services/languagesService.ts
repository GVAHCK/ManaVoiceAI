import apiClient from './apiClient';
import type { Language } from '../types';

export const languagesService = {
  async getLanguages(): Promise<Language[]> {
    const res = await apiClient.get<Language[]>('/languages');
    return res.data;
  },
};
