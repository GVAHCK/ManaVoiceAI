import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import type { LanguageDistributionPoint } from '../../types';

interface LanguageChartProps {
  data: LanguageDistributionPoint[];
  loading?: boolean;
}

// Strict 5-color palette exclusively
const APPROVED_CHART_COLORS = ['#3AAFA9', '#2B7A78', '#17252A', '#DEF2F1'];

export const LanguageChart: React.FC<LanguageChartProps> = ({ data, loading = false }) => {
  const hasData = data && data.length > 0 && data.some((d) => d.count > 0);

  return (
    <div className="card-mana p-3 h-100 d-flex flex-column">
      <div className="mb-2">
        <h2 className="h6 mb-0 fw-bold text-mv-midnight">Language Distribution</h2>
        <span className="text-mv-deep-teal" style={{ fontSize: '0.78rem' }}>
          Completed generations by target language
        </span>
      </div>

      <div className="flex-grow-1" style={{ minHeight: '240px' }}>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center h-100 text-mv-deep-teal">
            <div className="spinner-border spinner-border-sm text-mv-teal me-2" role="status" />
            <span>Loading language distribution...</span>
          </div>
        ) : !hasData ? (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-3">
            <i className="bi bi-globe fs-1 text-mv-teal mb-2" />
            <div className="fw-semibold text-mv-midnight">No language data yet</div>
            <div className="text-mv-deep-teal small">
              Generate speech in different languages to see distribution charts.
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="count"
                nameKey="name"
                stroke="#FFFFFF"
                strokeWidth={2}
              >
                {data.map((_, index) => (
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
                  <span style={{ color: '#17252A', fontSize: '0.8rem', fontWeight: 600 }}>
                    {val}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
