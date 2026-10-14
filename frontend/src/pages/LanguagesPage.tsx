import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { languagesService } from '../services/languagesService';
import type { Language } from '../types';

export const LanguagesPage: React.FC = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await languagesService.getLanguages();
        setLanguages(data);
      } catch (err) {
        console.error('Failed to load languages catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const filtered = languages.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.native_name.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q) ||
      (l.tts_model_id && l.tts_model_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="container-fluid p-0">
      <div className="card-mana p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h1 className="h5 fw-bold text-mv-midnight mb-0">Supported Speech Languages</h1>
            <span className="text-mv-deep-teal small">
              Official catalog of verified Hugging Face Transformers checkpoints and translation routes
            </span>
          </div>

          <Link to="/studio" className="btn btn-sm btn-mana d-flex align-items-center gap-1">
            <i className="bi bi-mic" />
            <span>Launch Studio</span>
          </Link>
        </div>

        {/* Search */}
        <div className="row">
          <div className="col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-mv-white text-mv-deep-teal border-mv-subtle">
                <i className="bi bi-search" />
              </span>
              <input
                type="text"
                className="form-control form-control-mana"
                placeholder="Search languages by name, native script, or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card-mana p-5 text-center text-mv-deep-teal">
          <div className="spinner-border text-mv-teal mb-2" role="status" />
          <div>Loading language catalog...</div>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map((lang) => (
            <div key={lang.code} className="col-md-6 col-xl-4">
              <div className="card-mana p-3 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge" style={{ backgroundColor: '#DEF2F1', color: '#17252A', border: '1px solid #3AAFA9' }}>
                      CODE: {lang.code.toUpperCase()}
                    </span>
                    <span className="badge-mana-completed">
                      <i className="bi bi-check-circle me-1" />
                      {lang.model_readiness.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="h6 fw-bold text-mv-midnight mb-1">
                    {lang.name} <span className="fw-normal text-mv-deep-teal">({lang.native_name})</span>
                  </h3>

                  <div className="small text-mv-deep-teal font-monospace mb-2" style={{ fontSize: '0.75rem' }}>
                    {lang.tts_model_id}
                  </div>

                  <p className="small text-mv-deep-teal mb-3">{lang.notes}</p>
                </div>

                <div className="pt-2 border-top border-mv-subtle d-flex align-items-center justify-content-between">
                  <div className="small text-mv-deep-teal">
                    <i className="bi bi-translate me-1" />
                    Translation: <strong>Supported</strong>
                  </div>
                  <Link
                    to={`/studio?target=${lang.code}`}
                    className="btn btn-sm btn-mana-outline"
                  >
                    Use in Studio
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
