import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import type { AnalyticsOverview } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const APPROVED_CHART_COLORS = ['#3AAFA9', '#2B7A78', '#17252A', '#DEF2F1'];

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (selectedDays: number) => {
    setLoading(true);
    try {
      const overview = await analyticsService.getOverview(selectedDays);
      setData(overview);
    } catch (e) {
      console.error('Failed to load analytics overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  return (
    <div className="container-fluid p-0">
      {/* Header Card */}
      <div className="card-mana p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h1 className="h5 fw-bold text-mv-midnight mb-0">Usage Analytics & Insights</h1>
            <span className="text-mv-deep-teal small">
              Real-time aggregation pipeline metrics across speech synthesis tasks
            </span>
          </div>

          <div className="btn-group btn-group-sm">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                className={`btn btn-sm ${days === d ? 'btn-mana' : 'btn-outline-secondary'}`}
                style={{
                  borderColor: '#2B7A78',
                  color: days === d ? '#FFFFFF' : '#2B7A78',
                  backgroundColor: days === d ? '#3AAFA9' : 'transparent',
                  fontWeight: 600,
                }}
                onClick={() => setDays(d)}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 4 Metric Highlights */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card-mana p-3">
            <span className="text-mv-deep-teal small fw-semibold">Total Requests</span>
            <div className="h3 fw-bold text-mv-midnight my-1">
              {loading ? '...' : data?.total_volume || 0}
            </div>
            <span className="text-mv-deep-teal small">Attempted syntheses</span>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card-mana p-3">
            <span className="text-mv-deep-teal small fw-semibold">Audio Duration</span>
            <div className="h3 fw-bold text-mv-midnight my-1">
              {loading ? '...' : `${data?.total_duration_hours || 0}h`}
            </div>
            <span className="text-mv-deep-teal small">
              Avg: {data?.average_duration_seconds || 0}s per request
            </span>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card-mana p-3">
            <span className="text-mv-deep-teal small fw-semibold">Characters Processed</span>
            <div className="h3 fw-bold text-mv-midnight my-1">
              {loading ? '...' : data?.total_characters.toLocaleString() || 0}
            </div>
            <span className="text-mv-deep-teal small">Total text synthesized</span>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card-mana p-3">
            <span className="text-mv-deep-teal small fw-semibold">Overall Success Rate</span>
            <div className="h3 fw-bold text-mv-midnight my-1">
              {loading ? '...' : `${data?.overall_success_rate || 0}%`}
            </div>
            <span className="text-mv-deep-teal small">Completed successfully</span>
          </div>
        </div>
      </div>

      {/* Daily Trends & Language Breakdown */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card-mana p-4 h-100">
            <h2 className="h6 fw-bold text-mv-midnight mb-1">Synthesis Trends Over Time</h2>
            <p className="text-mv-deep-teal small mb-3">
              Daily completed vs failed generation requests
            </p>

            <div style={{ height: '300px' }}>
              {loading ? (
                <div className="d-flex align-items-center justify-content-center h-100 text-mv-deep-teal">
                  <div className="spinner-border spinner-border-sm text-mv-teal me-2" role="status" />
                  Loading trends...
                </div>
              ) : !data?.daily_trends.some((d) => d.total_generations > 0) ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center text-mv-deep-teal">
                  <i className="bi bi-bar-chart fs-1 text-mv-teal mb-2" />
                  <div>No trend data available for this timeframe</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.daily_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DEF2F1" />
                    <XAxis
                      dataKey="date"
                      stroke="#2B7A78"
                      fontSize={11}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis stroke="#2B7A78" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#17252A',
                        border: '1px solid #3AAFA9',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={30}
                      formatter={(val) => (
                        <span style={{ color: '#17252A', fontSize: '0.78rem', fontWeight: 600 }}>
                          {val}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="completed_generations"
                      name="Completed"
                      fill="#3AAFA9"
                      stackId="a"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="failed_generations"
                      name="Failed"
                      fill="#17252A"
                      stackId="a"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card-mana p-4 h-100">
            <h2 className="h6 fw-bold text-mv-midnight mb-1">Language Distribution</h2>
            <p className="text-mv-deep-teal small mb-3">Volume by target speech language</p>

            <div style={{ height: '300px' }}>
              {loading ? (
                <div className="d-flex align-items-center justify-content-center h-100 text-mv-deep-teal">
                  <div className="spinner-border spinner-border-sm text-mv-teal me-2" role="status" />
                  Loading languages...
                </div>
              ) : !data?.language_usage.length ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center text-mv-deep-teal">
                  <i className="bi bi-globe fs-1 text-mv-teal mb-2" />
                  <div>No language data available</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.language_usage}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      nameKey="language_name"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    >
                      {data.language_usage.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={APPROVED_CHART_COLORS[index % APPROVED_CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#17252A',
                        border: '1px solid #3AAFA9',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(val) => (
                        <span style={{ color: '#17252A', fontSize: '0.78rem', fontWeight: 600 }}>
                          {val}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Model Registry Usage Breakdown */}
      <div className="card-mana p-4">
        <h2 className="h6 fw-bold text-mv-midnight mb-1">Model Architecture Utilization</h2>
        <p className="text-mv-deep-teal small mb-3">Verified checkpoints invoked for speech inference</p>

        <div className="table-responsive">
          <table className="table-mana">
            <thead>
              <tr>
                <th>Model Checkpoint</th>
                <th>Architecture</th>
                <th>Device</th>
                <th>License</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="fw-semibold">facebook/mms-tts-eng</td>
                <td>Meta MMS VITS</td>
                <td>CPU / Torch Native</td>
                <td>CC-BY-NC 4.0</td>
                <td>
                  <span className="badge-mana-completed">
                    <i className="bi bi-check-circle me-1" />
                    Verified & Active
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
