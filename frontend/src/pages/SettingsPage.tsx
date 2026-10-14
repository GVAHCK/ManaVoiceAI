import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { languagesService } from '../services/languagesService';
import type { Language } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('en');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [languages, setLanguages] = useState<Language[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setSourceLang(user.default_source_language || 'en');
      setTargetLang(user.default_target_language || 'en');
    }
    const loadLangs = async () => {
      try {
        const list = await languagesService.getLanguages();
        setLanguages(list);
      } catch (e) {
        console.error('Failed to load languages in settings:', e);
      }
    };
    loadLangs();
  }, [user]);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setLoading(true);

    try {
      const updates: any = {
        display_name: displayName,
        default_source_language: sourceLang,
        default_target_language: targetLang,
      };

      if (newPassword) {
        if (newPassword.length < 6) {
          setStatusMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setStatusMessage({ type: 'error', text: 'New passwords do not match.' });
          setLoading(false);
          return;
        }
        updates.password = newPassword;
      }

      await authService.updateProfile(updates);
      await refreshUser();
      setNewPassword('');
      setConfirmPassword('');
      setStatusMessage({ type: 'success', text: 'Account settings updated successfully in MongoDB.' });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to update preferences.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'Warning: This action is irreversible. All your generations and audio files will be permanently deleted. Type "DELETE" to confirm:'
    );
    if (confirmation === 'DELETE') {
      try {
        await authService.deleteAccount();
        alert('Account permanently deleted.');
        navigate('/register');
      } catch {
        alert('Failed to delete account.');
      }
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="card-mana p-4 mb-4">
        <h1 className="h5 fw-bold text-mv-midnight mb-1">Account & Preferences</h1>
        <p className="text-mv-deep-teal small mb-0">
          Manage your account profile, default translation directions, and security credentials
        </p>
      </div>

      {statusMessage && (
        <div
          className="p-3 mb-4 rounded d-flex align-items-center gap-2"
          style={{
            backgroundColor: statusMessage.type === 'success' ? '#DEF2F1' : 'rgba(23, 37, 42, 0.1)',
            border: `1px solid ${statusMessage.type === 'success' ? '#3AAFA9' : '#17252A'}`,
            color: '#17252A',
          }}
          role="alert"
        >
          <i
            className={`bi ${
              statusMessage.type === 'success' ? 'bi-check-circle text-mv-deep-teal' : 'bi-exclamation-circle text-mv-deep-teal'
            } fs-5`}
          />
          <span className="small">{statusMessage.text}</span>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-8">
          <form onSubmit={handleSavePreferences}>
            {/* Profile Information */}
            <div className="card-mana p-4 mb-4">
              <h2 className="h6 fw-bold text-mv-midnight mb-3">Profile Information</h2>

              <div className="mb-3">
                <label className="form-label small text-mv-deep-teal fw-semibold">Email Address</label>
                <input
                  type="email"
                  className="form-control form-control-mana"
                  value={user?.email || ''}
                  disabled
                  style={{ backgroundColor: '#DEF2F1', cursor: 'not-allowed' }}
                />
                <span className="text-mv-deep-teal" style={{ fontSize: '0.72rem' }}>
                  Email cannot be changed directly for security and database indexing reasons.
                </span>
              </div>

              <div className="mb-3">
                <label className="form-label small text-mv-deep-teal fw-semibold">Display Name</label>
                <input
                  type="text"
                  className="form-control form-control-mana"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small text-mv-deep-teal fw-semibold">
                    Default Source Language
                  </label>
                  <select
                    className="form-select form-control-mana"
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                  >
                    {languages.map((l) => (
                      <option key={`src-${l.code}`} value={l.code}>
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small text-mv-deep-teal fw-semibold">
                    Default Target Language
                  </label>
                  <select
                    className="form-select form-control-mana"
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                  >
                    {languages.map((l) => (
                      <option key={`tgt-${l.code}`} value={l.code}>
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="card-mana p-4 mb-4">
              <h2 className="h6 fw-bold text-mv-midnight mb-3">Security & Password</h2>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small text-mv-deep-teal fw-semibold">New Password</label>
                  <input
                    type="password"
                    className="form-control form-control-mana"
                    placeholder="Leave blank to keep current password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small text-mv-deep-teal fw-semibold">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-mana"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-mana px-4 py-2" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm text-mv-white me-2" role="status" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-1" />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Account Status & Danger Zone */}
        <div className="col-lg-4">
          <div className="card-mana p-4 mb-4">
            <h3 className="h6 fw-bold text-mv-midnight mb-2">Account Overview</h3>
            <div className="small text-mv-deep-teal mb-3">
              Role: <strong>{user?.role?.toUpperCase() || 'USER'}</strong>
            </div>

            <div className="small text-mv-deep-teal">
              <div>
                <strong>Member Since:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              </div>
              <div className="mt-1">
                <strong>Status:</strong>{' '}
                <span className="badge-mana-completed">Active &bull; Verified</span>
              </div>
            </div>
          </div>

          <div className="card-mana p-4" style={{ border: '1px solid #17252A' }}>
            <h3 className="h6 fw-bold text-mv-midnight mb-1">Danger Zone</h3>
            <p className="small text-mv-deep-teal mb-3">
              Permanently delete your account, saved recordings, and all generation history.
            </p>
            <button
              type="button"
              className="btn btn-outline-dark btn-sm w-100"
              style={{ borderColor: '#17252A', color: '#17252A' }}
              onClick={handleDeleteAccount}
            >
              <i className="bi bi-trash me-1" />
              Delete Account Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
