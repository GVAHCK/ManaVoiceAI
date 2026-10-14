import apiClient from './apiClient';
import type { Generation } from '../types';

export const speechService = {
  async translate(data: { text: string; source_language: string; target_language: string }) {
    const res = await apiClient.post<{
      original_text: string;
      translated_text: string;
      source_language: string;
      target_language: string;
      provider: string;
    }>('/speech/translate', data);
    return res.data;
  },

  async generate(data: {
    original_text: string;
    translated_text?: string;
    source_language: string;
    target_language: string;
    model_id?: string;
    voice_id?: string;
    speaking_rate?: number;
  }): Promise<Generation> {
    const res = await apiClient.post<Generation>('/speech/generate', data);
    return res.data;
  },

  async getGeneration(id: string): Promise<Generation> {
    const res = await apiClient.get<Generation>(`/speech/${id}`);
    return res.data;
  },

  async retryGeneration(id: string): Promise<Generation> {
    const res = await apiClient.post<Generation>(`/speech/${id}/retry`);
    return res.data;
  },

  async deleteGeneration(id: string): Promise<void> {
    await apiClient.delete(`/speech/${id}`);
  },

  getAudioUrl(id: string): string {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    return `${base}/speech/${id}/audio`;
  },
};
