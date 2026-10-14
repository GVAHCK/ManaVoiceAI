import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { ActivityDataPoint } from '../../types';

interface ActivityChartProps {
  data: ActivityDataPoint[];
  days: number;
  onPeriodChange: (days: number) => void;
  loading?: boolean;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({
  data,
  days,
  onPeriodChange,
  loading = false,
}) => {
  const hasData = data && data.some((d) => d.count > 0);

  return (
    <div className="card-mana p-3 h-100 d-flex flex-column">
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="h6 mb-0 fw-bold text-mv-midnight">Generation Activity</h2>
          <span className="text-mv-deep-teal" style={{ fontSize: '0.78rem' }}>
            Daily speech synthesis requests
          </span>
        </div>

        {/* Filter buttons */}
        <div className="btn-group btn-group-sm" role="group" aria-label="Activity period filter">
          {[7, 30, 90].map((period) => (
            <button
              key={period}
              type="button"
              className={`btn btn-sm ${
                days === period ? 'btn-mana' : 'btn-outline-secondary'
              }`}
              style={{
                borderColor: '#2B7A78',
                color: days === period ? '#FFFFFF' : '#2B7A78',
                backgroundColor: days === period ? '#3AAFA9' : 'transparent',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
              onClick={() => onPeriodChange(period)}
            >
              {period}D
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow-1" style={{ minHeight: '240px' }}>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center h-100 text-mv-deep-teal">
            <div className="spinner-border spinner-border-sm text-mv-teal me-2" role="status" />
            <span>Loading activity data...</span>
          </div>
        ) : !hasData ? (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-3">
            <i className="bi bi-bar-chart fs-1 text-mv-teal mb-2" />
            <div className="fw-semibold text-mv-midnight">No activity recorded for this period</div>
            <div className="text-mv-deep-teal small">
              Generate speech in the Speech Studio to see real-time trends here.
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="manaActivityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3AAFA9" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#DEF2F1" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#DEF2F1" />
              <XAxis
                dataKey="date"
                stroke="#2B7A78"
                fontSize={11}
                tickFormatter={(val) => val.slice(5)}
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
                labelStyle={{ color: '#DEF2F1', fontWeight: 'bold' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#2B7A78"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#manaActivityGradient)"
                name="Total Requests"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
