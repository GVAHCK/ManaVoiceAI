import apiClient from './apiClient';
import type {
  DashboardSummary,
  ActivityDataPoint,
  LanguageDistributionPoint,
  StatusDistributionPoint,
  Generation,
  MonthlyUsage,
} from '../types';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await apiClient.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  },

  async getActivity(days: number = 30): Promise<ActivityDataPoint[]> {
    const res = await apiClient.get<ActivityDataPoint[]>('/dashboard/activity', {
      params: { days },
    });
    return res.data;
  },

  async getLanguageDistribution(): Promise<LanguageDistributionPoint[]> {
    const res = await apiClient.get<LanguageDistributionPoint[]>('/dashboard/language-distribution');
    return res.data;
  },

  async getStatusDistribution(): Promise<StatusDistributionPoint[]> {
    const res = await apiClient.get<StatusDistributionPoint[]>('/dashboard/status-distribution');
    return res.data;
  },

  async getRecentGenerations(limit: number = 8): Promise<Generation[]> {
    const res = await apiClient.get<Generation[]>('/dashboard/recent-generations', {
      params: { limit },
    });
    return res.data;
  },

  async getUsage(): Promise<MonthlyUsage> {
    const res = await apiClient.get<MonthlyUsage>('/dashboard/usage');
    return res.data;
  },
};
