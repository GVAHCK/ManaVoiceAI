import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { MetricCard } from '../components/dashboard/MetricCard';
import { ActivityChart } from '../components/dashboard/ActivityChart';
import { LanguageChart } from '../components/dashboard/LanguageChart';
import { RecentGenerations } from '../components/dashboard/RecentGenerations';
import type {
  DashboardSummary,
  ActivityDataPoint,
  LanguageDistributionPoint,
  Generation,
  MonthlyUsage,
} from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activityDays, setActivityDays] = useState<number>(30);
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([]);
  const [languageData, setLanguageData] = useState<LanguageDistributionPoint[]>([]);
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsage | null>(null);

  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const fetchSummary = async () => {
    try {
      const data = await dashboardService.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchActivity = async (days: number) => {
    setLoadingActivity(true);
    try {
      const data = await dashboardService.getActivity(days);
      setActivityData(data);
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      const data = await dashboardService.getLanguageDistribution();
      setLanguageData(data);
    } catch (err) {
      console.error('Failed to load language distribution:', err);
    } finally {
      setLoadingLanguages(false);
    }
  };

  const fetchRecent = async () => {
    setLoadingRecent(true);
    try {
      const data = await dashboardService.getRecentGenerations(8);
      setRecentGenerations(data);
    } catch (err) {
      console.error('Failed to load recent generations:', err);
    } finally {
      setLoadingRecent(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const data = await dashboardService.getUsage();
      setMonthlyUsage(data);
    } catch (err) {
      console.error('Failed to load monthly usage:', err);
    }
  };

  const loadAll = () => {
    fetchSummary();
    fetchActivity(activityDays);
    fetchLanguages();
    fetchRecent();
    fetchUsage();
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handlePeriodChange = (days: number) => {
    setActivityDays(days);
    fetchActivity(days);
  };

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container-fluid p-0">
      {/* Welcome Section */}
      <div className="card-mana p-4 mb-4" style={{ backgroundColor: '#17252A', color: '#FFFFFF' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="text-mv-teal small text-uppercase fw-bold" style={{ letterSpacing: '0.06em' }}>
              {currentDateStr}
            </div>
            <h1 className="h3 fw-bold text-mv-white mb-1">
              Welcome back, {user?.display_name || 'Creator'}
            </h1>
            <p className="text-mv-mist small mb-0">
              ManaVoice AI is ready for multilingual speech generation and translation.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <Link to="/studio" className="btn btn-mana d-flex align-items-center gap-2">
              <i className="bi bi-mic" />
              <span>Generate New Speech</span>
            </Link>
            <Link
              to="/history"
              className="btn btn-outline-light d-flex align-items-center gap-2"
              style={{ borderColor: '#2B7A78', color: '#DEF2F1' }}
            >
              <i className="bi bi-clock-history" />
              <span>View History</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 6 Metric Cards Grid */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-2">
          <MetricCard
            label="Total Generations"
            value={summary?.total_generations.formatted || '0'}
            icon="bi-bar-chart"
            subtext="All attempted requests"
            loading={loadingMetrics}
          />
        </div>
        <div className="col-sm-6 col-xl-2">
          <MetricCard
            label="Successful"
            value={summary?.successful_generations.formatted || '0'}
            icon="bi-check-circle"
            subtext="Valid audio generated"
            loading={loadingMetrics}
          />
        </div>
        <div className="col-sm-6 col-xl-2">
          <MetricCard
            label="Total Duration"
            value={summary?.total_audio_duration_seconds.formatted || '0.0s'}
            icon="bi-volume-up"
            subtext="Synthesized speech time"
            loading={loadingMetrics}
          />
        </div>
        <div className="col-sm-6 col-xl-2">
          <MetricCard
            label="Characters"
            value={summary?.characters_processed.formatted || '0'}
            icon="bi-file-earmark-text"
            subtext="Successfully synthesized"
            loading={loadingMetrics}
          />
        </div>
        <div className="col-sm-6 col-xl-2">
          <MetricCard
            label="Languages Used"
            value={summary?.languages_used.formatted || '0'}
            icon="bi-globe"
            subtext="Distinct target languages"
            loading={loadingMetrics}
          />
        </div>
        <div className="col-sm-6 col-xl-2">
          <MetricCard
            label="Success Rate"
            value={summary?.success_rate_pct.formatted || '0%'}
            icon="bi-lightning-charge"
            subtext="Completed ratio"
            loading={loadingMetrics}
          />
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="card-mana p-3 mb-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold text-mv-midnight small text-uppercase" style={{ letterSpacing: '0.05em' }}>
              Quick Actions:
            </span>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <Link to="/studio" className="btn btn-sm btn-mana-outline d-flex align-items-center gap-1">
              <i className="bi bi-mic" />
              <span>Studio</span>
            </Link>
            <Link to="/studio?mode=translate" className="btn btn-sm btn-mana-outline d-flex align-items-center gap-1">
              <i className="bi bi-translate" />
              <span>Translate Text</span>
            </Link>
            <Link to="/history" className="btn btn-sm btn-mana-outline d-flex align-items-center gap-1">
              <i className="bi bi-clock-history" />
              <span>Browse History</span>
            </Link>
            <Link to="/languages" className="btn btn-sm btn-mana-outline d-flex align-items-center gap-1">
              <i className="bi bi-globe" />
              <span>Languages</span>
            </Link>
            <Link to="/analytics" className="btn btn-sm btn-mana-outline d-flex align-items-center gap-1">
              <i className="bi bi-bar-chart" />
              <span>Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <ActivityChart
            data={activityData}
            days={activityDays}
            onPeriodChange={handlePeriodChange}
            loading={loadingActivity}
          />
        </div>
        <div className="col-lg-4">
          <LanguageChart data={languageData} loading={loadingLanguages} />
        </div>
      </div>

      {/* Monthly Usage Box & Recent Activity Table */}
      <div className="row g-4">
        <div className="col-lg-12">
          {monthlyUsage && (
            <div className="card-mana p-3 mb-4" style={{ backgroundColor: '#DEF2F1', border: '1px solid #3AAFA9' }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-calendar-check text-mv-deep-teal fs-4" />
                  <div>
                    <div className="fw-bold text-mv-midnight small">Monthly Usage Summary</div>
                    <div className="text-mv-deep-teal small">
                      {monthlyUsage.generations_this_month} generations recorded this month &bull;{' '}
                      {monthlyUsage.characters_this_month.toLocaleString()} characters processed &bull;{' '}
                      {monthlyUsage.audio_seconds_this_month.toFixed(1)}s audio duration
                    </div>
                  </div>
                </div>
                <Link to="/analytics" className="btn btn-sm btn-mana">
                  Detailed Report
                </Link>
              </div>
            </div>
          )}

          <RecentGenerations
            items={recentGenerations}
            onRefresh={loadAll}
            loading={loadingRecent}
          />
        </div>
      </div>
    </div>
  );
};
