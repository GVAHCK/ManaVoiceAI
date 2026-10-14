import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        display_name: displayName,
        email,
        password,
      });
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. An account with this email may already exist.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center p-3"
      style={{ minHeight: '100vh', backgroundColor: '#DEF2F1' }}
    >
      <div className="card-mana p-4 p-sm-5" style={{ maxWidth: '460px', width: '100%' }}>
        {/* Brand Header */}
        <div className="text-center mb-4">
          <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none mb-2">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                backgroundColor: '#3AAFA9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <i className="bi bi-soundwave fs-3" />
            </div>
            <span style={{ color: '#17252A', fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>
              ManaVoice<span style={{ color: '#3AAFA9' }}>.AI</span>
            </span>
          </Link>
          <h1 className="h5 fw-bold text-mv-midnight mt-1">Create Your Account</h1>
          <p className="text-mv-deep-teal small mb-0">Join the multilingual AI speech generation platform</p>
        </div>

        {error && (
          <div
            className="p-3 mb-3 rounded d-flex align-items-center gap-2"
            style={{ backgroundColor: 'rgba(23, 37, 42, 0.1)', border: '1px solid #17252A', color: '#17252A' }}
            role="alert"
          >
            <i className="bi bi-exclamation-circle text-mv-deep-teal fs-5" />
            <span className="small">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Display Name */}
          <div className="mb-3">
            <label className="form-label text-mv-midnight fw-semibold small" htmlFor="reg-name">
              Full Name or Display Name
            </label>
            <div className="input-group">
              <span className="input-group-text bg-mv-white border-mv-subtle text-mv-deep-teal">
                <i className="bi bi-person" />
              </span>
              <input
                id="reg-name"
                type="text"
                className="form-control form-control-mana"
                placeholder="Alex Morgan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label text-mv-midnight fw-semibold small" htmlFor="reg-email">
              Email Address
            </label>
            <div className="input-group">
              <span className="input-group-text bg-mv-white border-mv-subtle text-mv-deep-teal">
                <i className="bi bi-envelope" />
              </span>
              <input
                id="reg-email"
                type="email"
                className="form-control form-control-mana"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label text-mv-midnight fw-semibold small" htmlFor="reg-password">
              Password
            </label>
            <div className="input-group">
              <span className="input-group-text bg-mv-white border-mv-subtle text-mv-deep-teal">
                <i className="bi bi-shield-lock" />
              </span>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control form-control-mana"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="btn btn-outline-secondary border-mv-subtle bg-mv-white text-mv-deep-teal"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label className="form-label text-mv-midnight fw-semibold small" htmlFor="reg-confirm">
              Confirm Password
            </label>
            <div className="input-group">
              <span className="input-group-text bg-mv-white border-mv-subtle text-mv-deep-teal">
                <i className="bi bi-shield-check" />
              </span>
              <input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                className="form-control form-control-mana"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-mana w-100 py-2 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-border spinner-border-sm text-mv-white" role="status" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <i className="bi bi-person-plus" />
                <span>Register</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-top border-mv-subtle">
          <span className="text-mv-deep-teal small">Already registered? </span>
          <Link to="/login" className="fw-semibold text-mv-teal small">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
