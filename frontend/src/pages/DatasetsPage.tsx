import React, { useState, useEffect } from 'react';
import { datasetService } from '../services/datasetService';
import type { DatasetItem } from '../services/datasetService';

export const DatasetsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [authStatus, setAuthStatus] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const res = await datasetService.listDatasets();
      setDatasets(res.datasets);
      setAuthStatus(res.authenticated_kaggle);
    } catch (e: any) {
      setMessage({ text: 'Failed to load dataset registry', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchDatasets();
      return;
    }
    try {
      setLoading(true);
      const res = await datasetService.searchDatasets(searchQuery);
      setDatasets(res.datasets);
      setMessage({
        text: `Found ${res.total} datasets (${res.source === 'kaggle_api_live' ? 'Live Kaggle API' : 'Verified Catalog'}).`,
        type: 'info',
      });
    } catch (e: any) {
      setMessage({ text: 'Search failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      setDownloadingId(id);
      setMessage({ text: `Preparing download manifest for '${id}' with storage safety verification...`, type: 'info' });
      await datasetService.downloadDataset(id);
      setMessage({ text: `Dataset '${id}' verified and registered in local storage.`, type: 'success' });
      fetchDatasets();
    } catch (err: any) {
      setMessage({ text: err?.response?.data?.detail || 'Download failed', type: 'error' });
    } finally {
      setDownloadingId(null);
    }
  };


  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#DEF2F1', minHeight: '100vh', color: '#17252A' }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(43, 122, 120, 0.3)' }}>
        <div>
          <h2 style={{ color: '#17252A', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Kaggle API & Dataset Registry Hub
          </h2>
          <p style={{ color: '#2B7A78', margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>
            Curate, search, inspect, and acquire benchmark datasets for ASR, Translation, TTS, and Lip-Sync models.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span
            className="badge px-3 py-2"
            style={{
              backgroundColor: authStatus ? '#3AAFA9' : '#2B7A78',
              color: '#FFFFFF',
              fontWeight: 600,
            }}
          >
            <i className={`bi ${authStatus ? 'bi-shield-check' : 'bi-shield-lock'} me-1`} />
            {authStatus ? 'Kaggle API Authenticated' : 'Offline Verified Registry Active'}
          </span>
        </div>
      </div>

      {message && (
        <div
          className="alert d-flex align-items-center justify-content-between mb-4 shadow-sm"
          style={{
            backgroundColor: message.type === 'error' ? '#17252A' : '#FFFFFF',
            color: message.type === 'error' ? '#DEF2F1' : '#2B7A78',
            borderLeft: `5px solid ${message.type === 'error' ? '#e74c3c' : '#3AAFA9'}`,
            borderRadius: '8px',
          }}
        >
          <span>{message.text}</span>
          <button className="btn btn-sm border-0" onClick={() => setMessage(null)} style={{ color: 'inherit' }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="card shadow-sm border-0 p-3 mb-4" style={{ backgroundColor: '#FFFFFF', borderRadius: '10px' }}>
        <form onSubmit={handleSearch} className="row g-2 align-items-center">
          <div className="col-12 col-md-9">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-0">
                <i className="bi bi-search" style={{ color: '#2B7A78' }} />
              </span>
              <input
                type="text"
                className="form-control border-0"
                placeholder="Search speech recognition, Indian languages, translation corpora, or lip-sync datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ outline: 'none', boxShadow: 'none' }}
              />
            </div>
          </div>
          <div className="col-12 col-md-3 d-flex gap-2">
            <button
              type="submit"
              className="btn flex-grow-1"
              style={{ backgroundColor: '#3AAFA9', color: '#FFFFFF', fontWeight: 600, borderRadius: '8px' }}
            >
              Search Datasets
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={fetchDatasets}
              style={{ borderColor: '#2B7A78', color: '#2B7A78', borderRadius: '8px' }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {!authStatus && (
        <div
          className="alert py-2 px-3 mb-4 d-flex align-items-center gap-2 shadow-sm"
          style={{ fontSize: '0.85rem', backgroundColor: '#FFFFFF', borderLeft: '4px solid #2B7A78', color: '#17252A' }}
        >
          <i className="bi bi-info-circle-fill" style={{ color: '#2B7A78' }} />
          <span>
            <strong>Curated Offline Catalog:</strong> Kaggle API credentials are not configured in <code>backend/.env</code>.
            Displaying verified offline dataset registry. Live Kaggle API searches and archive downloads will engage once valid credentials are provided.
          </span>
        </div>
      )}

      {/* Dataset Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: '#3AAFA9' }} role="status" />
          <div className="mt-2" style={{ color: '#2B7A78', fontWeight: 500 }}>Loading dataset catalog...</div>
        </div>
      ) : (
        <div className="row g-4">
          {datasets.map((ds) => (
            <div key={ds.id} className="col-12 col-md-6 col-xl-4">
              <div
                className="card h-100 shadow-sm border-0 p-4 d-flex flex-column justify-content-between"
                style={{ backgroundColor: '#FFFFFF', borderRadius: '12px' }}
              >
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge" style={{ backgroundColor: '#2B7A78' }}>
                      {ds.task_type.toUpperCase()}
                    </span>
                    <span className="badge" style={{ backgroundColor: '#DEF2F1', color: '#17252A' }}>
                      {ds.license}
                    </span>
                  </div>

                  <h5 style={{ color: '#17252A', fontWeight: 700, marginBottom: '0.4rem' }}>
                    {ds.name}
                  </h5>

                  <div style={{ fontSize: '0.75rem', color: '#2B7A78', marginBottom: '0.8rem', fontFamily: 'monospace' }}>
                    {ds.verified_identifier} (v{ds.version})
                  </div>

                  <div className="mb-3" style={{ fontSize: '0.85rem', color: '#17252A' }}>
                    <div><strong>Languages:</strong> {ds.languages?.join(', ') || 'Multilingual'}</div>
                    <div><strong>Approx Size:</strong> ~{ds.approximate_size_mb} MB</div>
                    {ds.citation && (
                      <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                        <em>{ds.citation}</em>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                  style={{
                    backgroundColor: '#17252A',
                    color: '#DEF2F1',
                    borderRadius: '8px',
                    fontWeight: 600,
                  }}
                  disabled={downloadingId === ds.id}
                  onClick={() => handleDownload(ds.id)}
                >
                  {downloadingId === ds.id ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" />
                      <span>Verifying Storage & Manifest...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-download" />
                      <span>Download & Register Manifest</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
