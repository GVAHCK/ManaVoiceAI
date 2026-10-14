import apiClient from './apiClient';
import type { AuthTokens, User } from '../types';

export const authService = {
  async register(data: { email: string; password: string; display_name: string }): Promise<AuthTokens> {
    const res = await apiClient.post<AuthTokens>('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthTokens> {
    const res = await apiClient.post<AuthTokens>('/auth/login', data);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('mv_access_token');
      localStorage.removeItem('mv_refresh_token');
    }
  },

  async updateProfile(data: Partial<User & { password?: string }>): Promise<User> {
    const res = await apiClient.patch<User>('/users/me', data);
    return res.data;
  },

  async deleteAccount(): Promise<void> {
    await apiClient.delete('/users/me');
    localStorage.removeItem('mv_access_token');
    localStorage.removeItem('mv_refresh_token');
  },
};
