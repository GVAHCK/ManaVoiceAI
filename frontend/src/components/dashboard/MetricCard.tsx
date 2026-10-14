import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  subtext: string;
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  subtext,
  loading = false,
}) => {
  return (
    <div className="card-mana p-3 h-100 d-flex flex-column justify-content-between">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="text-mv-deep-teal fw-semibold" style={{ fontSize: '0.85rem' }}>
          {label}
        </span>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#DEF2F1',
            color: '#2B7A78',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className={`bi ${icon} fs-5`} />
        </div>
      </div>

      <div className="my-1">
        {loading ? (
          <div
            className="placeholder-glow"
            style={{ height: '32px', width: '60%', backgroundColor: '#DEF2F1', borderRadius: '4px' }}
          />
        ) : (
          <div className="fw-bold text-mv-midnight" style={{ fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
            {value}
          </div>
        )}
      </div>

      <div className="text-mv-deep-teal" style={{ fontSize: '0.78rem' }}>
        {subtext}
      </div>
    </div>
  );
};
