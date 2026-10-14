import apiClient from './apiClient';
import type { AnalyticsOverview } from '../types';

export const analyticsService = {
  async getOverview(days: number = 30): Promise<AnalyticsOverview> {
    const res = await apiClient.get<AnalyticsOverview>('/analytics/overview', {
      params: { days },
    });
    return res.data;
  },
};
