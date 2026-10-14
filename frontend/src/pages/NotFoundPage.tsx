import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center text-center p-4"
      style={{ minHeight: '80vh' }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#DEF2F1',
          color: '#2B7A78',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          marginBottom: '1rem',
        }}
      >
        <i className="bi bi-question-lg" />
      </div>
      <h1 className="h4 fw-bold text-mv-midnight mb-2">Page Not Found</h1>
      <p className="text-mv-deep-teal mb-4 small" style={{ maxWidth: '400px' }}>
        The page you are looking for does not exist or has been moved to a new route.
      </p>
      <Link to="/dashboard" className="btn btn-mana">
        Return to Dashboard
      </Link>
    </div>
  );
};
