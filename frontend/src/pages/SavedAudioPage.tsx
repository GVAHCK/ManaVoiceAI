import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { savedAudioService } from '../services/savedAudioService';
import { speechService } from '../services/speechService';
import type { Generation } from '../types';

export const SavedAudioPage: React.FC = () => {
  const [items, setItems] = useState<Generation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const data = await savedAudioService.getSavedAudio();
      setItems(data);
    } catch (err) {
      console.error('Failed to load saved audio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

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
      alert('Unable to play audio.');
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

  const handleRemove = async (item: Generation) => {
    if (window.confirm('Remove this recording from your saved library?')) {
      try {
        await savedAudioService.unsaveAudio(item.id);
        if (playingId === item.id && activeAudio) {
          activeAudio.pause();
          setPlayingId(null);
        }
        fetchSaved();
      } catch {
        alert('Failed to remove saved item.');
      }
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.original_text.toLowerCase().includes(q) ||
      (item.translated_text && item.translated_text.toLowerCase().includes(q))
    );
  });

  return (
    <div className="container-fluid p-0">
      <div className="card-mana p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h1 className="h5 fw-bold text-mv-midnight mb-0">Saved Audio Library</h1>
            <span className="text-mv-deep-teal small">
              {items.length} bookmarked audio recordings saved in your library
            </span>
          </div>
          <Link to="/studio" className="btn btn-sm btn-mana d-flex align-items-center gap-1">
            <i className="bi bi-mic" />
            <span>Generate More</span>
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
                placeholder="Filter saved audio recordings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Saved Recordings */}
      {loading ? (
        <div className="card-mana p-5 text-center text-mv-deep-teal">
          <div className="spinner-border text-mv-teal mb-2" role="status" />
          <div>Loading saved audio library...</div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card-mana p-5 text-center text-mv-deep-teal">
          <i className="bi bi-bookmark fs-1 text-mv-teal d-block mb-2" />
          <div className="fw-semibold text-mv-midnight">No saved audio recordings found</div>
          <div className="small mb-3">
            Bookmark generations from the Speech Studio or Generation History to keep them in this library.
          </div>
          <Link to="/studio" className="btn btn-mana btn-sm">
            Go to Speech Studio
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="col-md-6 col-xl-4">
              <div className="card-mana p-3 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge" style={{ backgroundColor: '#DEF2F1', color: '#17252A', border: '1px solid #2B7A78' }}>
                      {item.source_language.toUpperCase()} &rarr; {item.target_language.toUpperCase()}
                    </span>
                    <span className="small text-mv-deep-teal fw-semibold">
                      <i className="bi bi-clock me-1" />
                      {item.duration_seconds.toFixed(1)}s
                    </span>
                  </div>

                  <p className="fw-semibold text-mv-midnight small mb-2" style={{ lineHeight: '1.4' }}>
                    {item.original_text}
                  </p>

                  {item.translated_text && item.translated_text !== item.original_text && (
                    <p className="text-mv-deep-teal small mb-2">
                      <i className="bi bi-translate me-1" />
                      {item.translated_text}
                    </p>
                  )}

                  <div className="small text-mv-deep-teal mb-3" style={{ fontSize: '0.72rem' }}>
                    Saved on {new Date(item.created_at).toLocaleDateString()} &bull; {item.sample_rate} Hz
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between pt-2 border-top border-mv-subtle">
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm btn-mana d-flex align-items-center gap-1"
                      onClick={() => handlePlay(item)}
                    >
                      <i className={`bi ${playingId === item.id ? 'bi-pause-circle' : 'bi-play-circle'}`} />
                      <span>{playingId === item.id ? 'Pause' : 'Play'}</span>
                    </button>
                    <button
                      className="btn btn-sm btn-mana-outline"
                      title="Download audio file"
                      onClick={() => handleDownload(item)}
                    >
                      <i className="bi bi-download" />
                    </button>
                  </div>

                  <button
                    className="btn btn-sm text-mv-midnight border-0"
                    title="Remove from saved library"
                    onClick={() => handleRemove(item)}
                  >
                    <i className="bi bi-trash text-mv-deep-teal" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
