import apiClient from './apiClient';
import type { Generation } from '../types';

export const savedAudioService = {
  async getSavedAudio(): Promise<Generation[]> {
    const res = await apiClient.get<Generation[]>('/saved-audio');
    return res.data;
  },

  async saveAudio(id: string): Promise<void> {
    await apiClient.post(`/saved-audio/${id}`);
  },

  async unsaveAudio(id: string): Promise<void> {
    await apiClient.delete(`/saved-audio/${id}`);
  },
};
