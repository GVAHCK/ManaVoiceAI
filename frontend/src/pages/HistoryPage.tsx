import React, { useState, useEffect } from 'react';
import { historyService } from '../services/historyService';
import { speechService } from '../services/speechService';
import { savedAudioService } from '../services/savedAudioService';
import { languagesService } from '../services/languagesService';
import type { Generation, Language } from '../types';

export const HistoryPage: React.FC = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [targetLang, setTargetLang] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [selectedItem, setSelectedItem] = useState<Generation | null>(null);

  const fetchLanguages = async () => {
    try {
      const data = await languagesService.getLanguages();
      setLanguages(data);
    } catch (e) {
      console.error('Failed to load languages:', e);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await historyService.getHistory({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        target_language: targetLang || undefined,
        status: statusFilter || undefined,
        sort_by: sortBy,
      });
      setGenerations(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [page, targetLang, statusFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handlePlay = (item: Generation) => {
    const audioUrl = speechService.getAudioUrl(item.id);
    if (playingId === item.id) {
      if (activeAudio) activeAudio.pause();
      setPlayingId(null);
      return;
    }
    if (activeAudio) activeAudio.pause();

    const audio = new Audio(audioUrl);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => {
      alert('Unable to play audio. Audio file may be missing.');
      setPlayingId(null);
    };
    audio.play();
    setActiveAudio(audio);
    setPlayingId(item.id);
  };

  const handleDownload = (item: Generation) => {
    const audioUrl = speechService.getAudioUrl(item.id);
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `manavoice_${item.id}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleToggleSave = async (item: Generation) => {
    try {
      if (item.is_saved) {
        await savedAudioService.unsaveAudio(item.id);
      } else {
        await savedAudioService.saveAudio(item.id);
      }
      fetchHistory();
    } catch {
      alert('Failed to update bookmark.');
    }
  };

  const handleDelete = async (item: Generation) => {
    if (window.confirm('Are you sure you want to delete this generation?')) {
      try {
        await historyService.deleteHistoryItem(item.id);
        if (playingId === item.id && activeAudio) {
          activeAudio.pause();
          setPlayingId(null);
        }
        fetchHistory();
      } catch {
        alert('Failed to delete history item.');
      }
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Header & Filter Card */}
      <div className="card-mana p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h1 className="h5 fw-bold text-mv-midnight mb-0">Generation History</h1>
            <span className="text-mv-deep-teal small">
              {total} total speech generation records found in MongoDB
            </span>
          </div>
          <button className="btn btn-sm btn-mana-outline d-flex align-items-center gap-1" onClick={fetchHistory}>
            <i className="bi bi-arrow-repeat" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-mv-white text-mv-deep-teal border-mv-subtle">
                <i className="bi bi-search" />
              </span>
              <input
                type="text"
                className="form-control form-control-mana"
                placeholder="Search text or translation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-mana btn-sm">
                Search
              </button>
            </div>
          </div>

          <div className="col-sm-3 col-md-2">
            <select
              className="form-select form-select-sm form-control-mana"
              value={targetLang}
              onChange={(e) => {
                setTargetLang(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Languages</option>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-sm-3 col-md-2">
            <select
              className="form-select form-select-sm form-control-mana"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="col-sm-3 col-md-2">
            <select
              className="form-select form-select-sm form-control-mana"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div className="col-sm-3 col-md-2 text-end">
            {(search || targetLang || statusFilter) && (
              <button
                type="button"
                className="btn btn-sm btn-mana-ghost"
                onClick={() => {
                  setSearch('');
                  setTargetLang('');
                  setStatusFilter('');
                  setPage(1);
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table Card */}
      <div className="card-mana p-3 mb-4">
        <div className="table-responsive">
          <table className="table-mana">
            <thead>
              <tr>
                <th>Original Text</th>
                <th>Target Language</th>
                <th>Model</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Created</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-mv-deep-teal">
                    <div className="spinner-border spinner-border-sm text-mv-teal me-2" role="status" />
                    Loading history records...
                  </td>
                </tr>
              ) : generations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-mv-deep-teal">
                    <i className="bi bi-clock-history fs-1 text-mv-teal d-block mb-2" />
                    <div className="fw-semibold text-mv-midnight">No history matches your filters</div>
                    <div className="small">Try adjusting search criteria or generate new speech.</div>
                  </td>
                </tr>
              ) : (
                generations.map((item) => (
                  <tr key={item.id}>
                    <td style={{ maxWidth: '280px' }}>
                      <div className="text-truncate fw-semibold" title={item.original_text}>
                        {item.original_text}
                      </div>
                      {item.translated_text && item.translated_text !== item.original_text && (
                        <div
                          className="text-truncate text-mv-deep-teal small"
                          title={item.translated_text}
                        >
                          <i className="bi bi-translate me-1" />
                          {item.translated_text}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#DEF2F1', color: '#17252A', border: '1px solid #2B7A78' }}>
                        {item.source_language.toUpperCase()} &rarr; {item.target_language.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#2B7A78' }}>
                      {item.model_id.replace('facebook/', '')}
                    </td>
                    <td>
                      <span
                        className={`badge-mana-${
                          item.status === 'completed'
                            ? 'completed'
                            : item.status === 'failed'
                            ? 'failed'
                            : 'pending'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{item.status === 'completed' ? `${item.duration_seconds.toFixed(1)}s` : '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: '#2B7A78' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {item.status === 'completed' && (
                          <>
                            <button
                              className="btn btn-sm btn-mana-outline"
                              title={playingId === item.id ? 'Pause' : 'Play'}
                              onClick={() => handlePlay(item)}
                            >
                              <i className={`bi ${playingId === item.id ? 'bi-pause-circle' : 'bi-play-circle'}`} />
                            </button>
                            <button
                              className="btn btn-sm btn-mana-outline"
                              title="Download"
                              onClick={() => handleDownload(item)}
                            >
                              <i className="bi bi-download" />
                            </button>
                            <button
                              className="btn btn-sm btn-mana-outline"
                              title={item.is_saved ? 'Remove Bookmark' : 'Bookmark'}
                              onClick={() => handleToggleSave(item)}
                            >
                              <i className={`bi ${item.is_saved ? 'bi-bookmark-fill' : 'bi-bookmark'}`} />
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-sm btn-mana-outline"
                          title="Details"
                          onClick={() => setSelectedItem(item)}
                        >
                          <i className="bi bi-three-dots" />
                        </button>
                        <button
                          className="btn btn-sm btn-mana-outline"
                          title="Delete"
                          onClick={() => handleDelete(item)}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="d-flex align-items-center justify-content-between pt-3 border-top border-mv-subtle flex-wrap gap-2">
            <span className="small text-mv-deep-teal">
              Page {page} of {totalPages} ({total} items)
            </span>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-mana-outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-mana-outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content-mana" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom border-mv-subtle">
              <h3 className="h6 mb-0 fw-bold text-mv-midnight">Record Details</h3>
              <button
                className="btn btn-sm text-mv-midnight border-0"
                onClick={() => setSelectedItem(null)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="py-3">
              <div className="mb-2">
                <label className="text-mv-deep-teal fw-semibold small">Record ID:</label>
                <div className="small font-monospace text-mv-midnight">{selectedItem.id}</div>
              </div>
              <div className="mb-2">
                <label className="text-mv-deep-teal fw-semibold small">Original Text:</label>
                <div className="p-2 rounded small" style={{ backgroundColor: '#DEF2F1' }}>
                  {selectedItem.original_text}
                </div>
              </div>
              {selectedItem.translated_text && (
                <div className="mb-2">
                  <label className="text-mv-deep-teal fw-semibold small">Translated Text:</label>
                  <div className="p-2 rounded small" style={{ backgroundColor: '#DEF2F1' }}>
                    {selectedItem.translated_text}
                  </div>
                </div>
              )}
              <div className="row g-2 mt-1 small">
                <div className="col-6">
                  <strong>Source &rarr; Target:</strong> {selectedItem.source_language.toUpperCase()} &rarr;{' '}
                  {selectedItem.target_language.toUpperCase()}
                </div>
                <div className="col-6">
                  <strong>Status:</strong> {selectedItem.status}
                </div>
                <div className="col-6">
                  <strong>Model:</strong> {selectedItem.model_id}
                </div>
                <div className="col-6">
                  <strong>Duration:</strong> {selectedItem.duration_seconds.toFixed(2)}s
                </div>
                <div className="col-6">
                  <strong>Sample Rate:</strong> {selectedItem.sample_rate} Hz
                </div>
                <div className="col-6">
                  <strong>Characters:</strong> {selectedItem.character_count}
                </div>
              </div>
            </div>
            <div className="pt-3 border-top border-mv-subtle text-end">
              <button className="btn btn-mana-secondary btn-sm" onClick={() => setSelectedItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
