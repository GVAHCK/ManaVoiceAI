import React, { useState } from 'react';
import type { Generation } from '../../types';
import { speechService } from '../../services/speechService';
import { savedAudioService } from '../../services/savedAudioService';

interface RecentGenerationsProps {
  items: Generation[];
  onRefresh: () => void;
  loading?: boolean;
}

export const RecentGenerations: React.FC<RecentGenerationsProps> = ({
  items,
  onRefresh,
  loading = false,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [selectedItem, setSelectedItem] = useState<Generation | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handlePlay = (item: Generation) => {
    if (!item.id) return;
    const audioUrl = speechService.getAudioUrl(item.id);

    if (playingId === item.id) {
      if (activeAudio) {
        activeAudio.pause();
      }
      setPlayingId(null);
      return;
    }

    if (activeAudio) {
      activeAudio.pause();
    }

    const audio = new Audio(audioUrl);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => {
      alert('Unable to play audio. The audio file may not be available.');
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
    setActionLoading(item.id);
    try {
      if (item.is_saved) {
        await savedAudioService.unsaveAudio(item.id);
      } else {
        await savedAudioService.saveAudio(item.id);
      }
      onRefresh();
    } catch {
      alert('Failed to update bookmark status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (item: Generation) => {
    if (window.confirm('Are you sure you want to delete this generation and its audio?')) {
      setActionLoading(item.id);
      try {
        await speechService.deleteGeneration(item.id);
        if (playingId === item.id && activeAudio) {
          activeAudio.pause();
          setPlayingId(null);
        }
        onRefresh();
      } catch {
        alert('Failed to delete generation.');
      } finally {
        setActionLoading(null);
      }
    }
  };

  return (
    <div className="card-mana p-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="h6 mb-0 fw-bold text-mv-midnight">Recent Activity</h2>
          <span className="text-mv-deep-teal" style={{ fontSize: '0.78rem' }}>
            Latest speech generations and actions
          </span>
        </div>
        <button
          className="btn btn-sm btn-mana-outline d-flex align-items-center gap-1"
          onClick={onRefresh}
          disabled={loading}
        >
          <i className="bi bi-arrow-repeat" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="table-responsive">
        <table className="table-mana">
          <thead>
            <tr>
              <th>Preview Text</th>
              <th>Languages</th>
              <th>Model</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Date</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-mv-deep-teal">
                  <div className="spinner-border spinner-border-sm text-mv-teal me-2" role="status" />
                  Loading activity...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-mv-deep-teal">
                  <i className="bi bi-file-earmark-text fs-2 text-mv-teal d-block mb-1" />
                  No generations found. Start by generating speech in the Speech Studio.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td style={{ maxWidth: '240px' }}>
                    <div className="text-truncate fw-semibold" title={item.original_text}>
                      {item.original_text}
                    </div>
                    {item.translated_text && item.translated_text !== item.original_text && (
                      <div
                        className="text-truncate text-mv-deep-teal"
                        style={{ fontSize: '0.78rem' }}
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
                  <td style={{ fontSize: '0.85rem' }}>
                    {item.status === 'completed' ? `${item.duration_seconds.toFixed(1)}s` : '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#2B7A78' }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      {item.status === 'completed' && (
                        <>
                          <button
                            className="btn btn-sm btn-mana-outline"
                            title={playingId === item.id ? 'Pause audio' : 'Play audio'}
                            onClick={() => handlePlay(item)}
                          >
                            <i className={`bi ${playingId === item.id ? 'bi-pause-circle' : 'bi-play-circle'}`} />
                          </button>
                          <button
                            className="btn btn-sm btn-mana-outline"
                            title="Download audio"
                            onClick={() => handleDownload(item)}
                          >
                            <i className="bi bi-download" />
                          </button>
                          <button
                            className="btn btn-sm btn-mana-outline"
                            title={item.is_saved ? 'Remove bookmark' : 'Bookmark audio'}
                            onClick={() => handleToggleSave(item)}
                            disabled={actionLoading === item.id}
                          >
                            <i className={`bi ${item.is_saved ? 'bi-bookmark-fill' : 'bi-bookmark'}`} />
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-sm btn-mana-outline"
                        title="View details"
                        onClick={() => setSelectedItem(item)}
                      >
                        <i className="bi bi-three-dots" />
                      </button>
                      <button
                        className="btn btn-sm btn-mana-outline"
                        title="Delete generation"
                        onClick={() => handleDelete(item)}
                        disabled={actionLoading === item.id}
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

      {/* Details Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content-mana" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom border-mv-subtle">
              <h3 className="h6 mb-0 fw-bold text-mv-midnight">Generation Details</h3>
              <button
                className="btn btn-sm text-mv-midnight border-0"
                onClick={() => setSelectedItem(null)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="py-3">
              <div className="mb-2">
                <label className="text-mv-deep-teal fw-semibold small">ID:</label>
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
              <div className="row g-2 mt-1">
                <div className="col-6">
                  <label className="text-mv-deep-teal fw-semibold small">Languages:</label>
                  <div className="small">
                    {selectedItem.source_language.toUpperCase()} &rarr; {selectedItem.target_language.toUpperCase()}
                  </div>
                </div>
                <div className="col-6">
                  <label className="text-mv-deep-teal fw-semibold small">Model:</label>
                  <div className="small">{selectedItem.model_id}</div>
                </div>
                <div className="col-6">
                  <label className="text-mv-deep-teal fw-semibold small">Duration / Sample Rate:</label>
                  <div className="small">
                    {selectedItem.duration_seconds.toFixed(2)}s @ {selectedItem.sample_rate} Hz
                  </div>
                </div>
                <div className="col-6">
                  <label className="text-mv-deep-teal fw-semibold small">File Size / Characters:</label>
                  <div className="small">
                    {(selectedItem.file_size_bytes / 1024).toFixed(1)} KB / {selectedItem.character_count} chars
                  </div>
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
