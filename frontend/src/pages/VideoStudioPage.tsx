import React, { useState, useEffect, useRef } from 'react';
import { localizationService } from '../services/localizationService';
import type { LocalizationJob } from '../services/localizationService';

export const VideoStudioPage: React.FC = () => {
  // Mode selection: Mode A (Audio Translation) or Mode B (Video Localization)
  const [activeMode, setActiveMode] = useState<'video' | 'audio'>('video');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [probeInfo, setProbeInfo] = useState<any>(null);

  // Configuration options
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [enableLipsync, setEnableLipsync] = useState(true);
  const [burnSubtitles, setBurnSubtitles] = useState(false);
  const [speakingRate, setSpeakingRate] = useState(1.0);
  const [bgVolume, setBgVolume] = useState(0.2);

  // Active Job State
  const [activeJob, setActiveJob] = useState<LocalizationJob | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish (Español)' },
    { code: 'fr', name: 'French (Français)' },
    { code: 'de', name: 'German (Deutsch)' },
    { code: 'hi', name: 'Hindi (हिन्दी)' },
    { code: 'te', name: 'Telugu (తెలుగు)' },
    { code: 'ta', name: 'Tamil (தமிழ்)' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'ml', name: 'Malayalam (മലയാളം)' },
    { code: 'bn', name: 'Bengali (বাংলা)' },
    { code: 'mr', name: 'Marathi (मराठी)' },
  ];

  // Poll job status
  useEffect(() => {
    let timer: any = null;

    if (activeJob && (activeJob.status === 'pending' || activeJob.status === 'processing')) {
      timer = setInterval(async () => {
        try {
          const updated = await localizationService.getJob(activeJob.id);
          setActiveJob(updated);
          if (updated.status === 'completed' || updated.status === 'failed') {
            if (timer) clearInterval(timer);
          }
        } catch (e) {
          console.error('Job polling error:', e);
        }
      }, 2000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeJob?.id, activeJob?.status]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setMediaPreviewUrl(URL.createObjectURL(file));

      // Auto upload & probe
      try {
        setUploading(true);
        setNotification({ type: 'info', message: 'Uploading and analyzing media streams...' });
        const res = await localizationService.uploadMedia(file);
        setUploadedKey(res.storage_key);
        setProbeInfo(res.probe);
        setNotification({ type: 'success', message: `Media probed: ${res.probe.duration}s duration, ${res.probe.has_video ? 'Video + Audio' : 'Audio only'}.` });
      } catch (err: any) {
        setNotification({ type: 'error', message: err?.response?.data?.detail || 'Media upload failed' });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleStartLocalization = async () => {
    if (!uploadedKey || !selectedFile) {
      setNotification({ type: 'error', message: 'Please select and upload a media file first.' });
      return;
    }

    try {
      setNotification({ type: 'info', message: 'Launching background localization pipeline...' });
      const job = await localizationService.createJob({
        source_media_storage_key: uploadedKey,
        source_filename: selectedFile.name,
        source_language: sourceLang,
        target_language: targetLang,
        job_type: activeMode === 'video' ? 'video_localization' : 'audio_translation',
        enable_lipsync: activeMode === 'video' ? enableLipsync : false,
        burn_subtitles: burnSubtitles,
        speech_volume: 1.0,
        background_volume: bgVolume,
        speaking_rate: speakingRate,
      });
      setActiveJob(job);
      setNotification({ type: 'success', message: 'Pipeline queued. Processing stages initialized.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.response?.data?.detail || 'Failed to start localization' });
    }
  };

  const handleSegmentUpdate = async (segmentId: number, translatedText: string, speaker: string) => {
    if (!activeJob) return;
    try {
      const updated = await localizationService.updateSegment(activeJob.id, segmentId, {
        translated_text: translatedText,
        speaker: speaker,
      });
      setActiveJob(updated);
      setNotification({ type: 'success', message: `Segment #${segmentId} updated.` });
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to update segment' });
    }
  };

  const pipelineStages = [
    { key: 'ingestion', label: 'Media Ingestion', icon: 'bi-file-earmark-play' },
    { key: 'extraction', label: 'Audio Extraction', icon: 'bi-soundwave' },
    { key: 'transcription', label: 'Whisper ASR', icon: 'bi-chat-dots' },
    { key: 'translation', label: 'Neural MT', icon: 'bi-translate' },
    { key: 'synthesis', label: 'Voice Synthesis', icon: 'bi-mic-fill' },
    { key: 'lipsync', label: 'Lip-Sync', icon: 'bi-emoji-smile' },
    { key: 'rendering', label: 'Video Rendering', icon: 'bi-film' },
  ];

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#DEF2F1', minHeight: '100vh', color: '#17252A' }}>
      {/* Header & Mode Switcher */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(43, 122, 120, 0.3)' }}>
        <div>
          <h2 style={{ color: '#17252A', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Multilingual Video Translation & Lip-Sync Studio
          </h2>
          <p style={{ color: '#2B7A78', margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>
            End-to-end neural localization, voice synthesis, timestamp alignment, and audio-driven lip synchronization.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="btn-group p-1" style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1.5px solid #2B7A78' }}>
          <button
            className="btn btn-sm d-flex align-items-center gap-2"
            style={{
              backgroundColor: activeMode === 'video' ? '#3AAFA9' : 'transparent',
              color: activeMode === 'video' ? '#FFFFFF' : '#17252A',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              padding: '0.5rem 1rem',
            }}
            onClick={() => setActiveMode('video')}
          >
            <i className="bi bi-camera-video" />
            <span>Mode B: Video Localization</span>
          </button>
          <button
            className="btn btn-sm d-flex align-items-center gap-2"
            style={{
              backgroundColor: activeMode === 'audio' ? '#3AAFA9' : 'transparent',
              color: activeMode === 'audio' ? '#FFFFFF' : '#17252A',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              padding: '0.5rem 1rem',
            }}
            onClick={() => setActiveMode('audio')}
          >
            <i className="bi bi-music-note-beamed" />
            <span>Mode A: Audio & Text Dubbing</span>
          </button>
        </div>
      </div>

      {notification && (
        <div
          className="alert d-flex align-items-center justify-content-between mb-4 shadow-sm"
          style={{
            backgroundColor: notification.type === 'error' ? '#17252A' : '#FFFFFF',
            color: notification.type === 'error' ? '#DEF2F1' : '#2B7A78',
            borderLeft: `5px solid ${notification.type === 'error' ? '#e74c3c' : '#3AAFA9'}`,
            borderRadius: '8px',
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <i className={`bi ${notification.type === 'error' ? 'bi-exclamation-triangle' : 'bi-info-circle'} fs-5`} />
            <span style={{ fontWeight: 500 }}>{notification.message}</span>
          </div>
          <button className="btn btn-sm border-0" onClick={() => setNotification(null)} style={{ color: 'inherit' }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Upload & Configuration */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 p-4 mb-4" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
            <h5 style={{ color: '#17252A', fontWeight: 700, marginBottom: '1rem' }}>
              <i className="bi bi-cloud-arrow-up me-2" style={{ color: '#3AAFA9' }} />
              1. Ingest Media Asset
            </h5>

            {/* Drag & Drop Area */}
            <div
              className="p-4 text-center border-2 border-dashed mb-3"
              style={{
                borderColor: '#3AAFA9',
                borderRadius: '10px',
                backgroundColor: '#DEF2F1',
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="d-none"
                accept={activeMode === 'video' ? 'video/mp4,video/quicktime,video/x-matroska,video/webm' : 'audio/*,video/*'}
                onChange={handleFileChange}
              />
              <i className={`bi ${activeMode === 'video' ? 'bi-file-earmark-play' : 'bi-file-earmark-music'} fs-1`} style={{ color: '#2B7A78' }} />
              <div style={{ fontWeight: 600, color: '#17252A', marginTop: '0.5rem' }}>
                {selectedFile ? selectedFile.name : `Click or drag & drop ${activeMode === 'video' ? 'video (MP4, MOV, MKV, WebM)' : 'audio/video file'}`}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#2B7A78' }}>
                Up to 100 MB • 1080p, 720p, 480p supported
              </div>
            </div>

            {/* Probe info & Preview */}
            {mediaPreviewUrl && (
              <div className="mb-3">
                {activeMode === 'video' && probeInfo?.has_video ? (
                  <video
                    ref={videoPlayerRef}
                    src={mediaPreviewUrl}
                    controls
                    className="w-100 rounded"
                    style={{ maxHeight: '220px', backgroundColor: '#17252A' }}
                  />
                ) : (
                  <audio src={mediaPreviewUrl} controls className="w-100" />
                )}
                {probeInfo && (
                  <div className="p-2 mt-2 rounded d-flex justify-content-between" style={{ backgroundColor: '#DEF2F1', fontSize: '0.8rem', color: '#17252A' }}>
                    <span><strong>Duration:</strong> {probeInfo.duration}s</span>
                    <span><strong>Resolution:</strong> {probeInfo.video ? `${probeInfo.video.width}x${probeInfo.video.height}` : 'N/A'}</span>
                    <span><strong>Audio:</strong> {probeInfo.audio?.sample_rate}Hz</span>
                  </div>
                )}
              </div>
            )}

            {/* Language Selection */}
            <h5 style={{ color: '#17252A', fontWeight: 700, margin: '1.5rem 0 1rem' }}>
              <i className="bi bi-sliders me-2" style={{ color: '#3AAFA9' }} />
              2. Localization Settings
            </h5>

            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Source Language</label>
                <select
                  className="form-select"
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  style={{ borderColor: '#2B7A78', borderRadius: '8px' }}
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Target Language</label>
                <select
                  className="form-select"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  style={{ borderColor: '#3AAFA9', borderRadius: '8px', fontWeight: 600 }}
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Video Controls */}
            {activeMode === 'video' && (
              <div className="p-3 rounded mb-3" style={{ backgroundColor: '#DEF2F1', border: '1px solid #2B7A78' }}>
                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="lipsyncToggle"
                    checked={enableLipsync}
                    onChange={(e) => setEnableLipsync(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="lipsyncToggle" style={{ fontWeight: 600 }}>
                    Enable Audio-Driven Lip Synchronization (Wav2Lip)
                  </label>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#2B7A78', marginBottom: '0.8rem' }}>
                  Tracks visible faces and adjusts mouth movements. Gracefully falls back to dubbed audio muxing if no face is visible.
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="subtitlesBurnToggle"
                    checked={burnSubtitles}
                    onChange={(e) => setBurnSubtitles(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="subtitlesBurnToggle" style={{ fontWeight: 600 }}>
                    Burn Subtitles into Video Track
                  </label>
                </div>

                <div className="mb-2">
                  <div className="d-flex justify-content-between" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    <span>Background Ambience Volume:</span>
                    <span>{Math.round(bgVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={bgVolume}
                    onChange={(e) => setBgVolume(parseFloat(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Speaking Rate Control */}
            <div className="mb-4">
              <div className="d-flex justify-content-between" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                <span>Speech Synthesis Rate:</span>
                <span>{speakingRate}x</span>
              </div>
              <input
                type="range"
                className="form-range"
                min="0.75"
                max="1.35"
                step="0.05"
                value={speakingRate}
                onChange={(e) => setSpeakingRate(parseFloat(e.target.value))}
              />
            </div>

            {/* Launch Button */}
            <button
              className="btn w-100 py-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
              style={{
                backgroundColor: '#3AAFA9',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1rem',
                borderRadius: '8px',
                border: 'none',
              }}
              disabled={uploading || !uploadedKey || activeJob?.status === 'processing'}
              onClick={handleStartLocalization}
            >
              {activeJob?.status === 'processing' ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Processing Localization Pipeline...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-play-circle-fill fs-5" />
                  <span>Start Multilingual Localization</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Processing Pipeline, Timeline Editor & Export Center */}
        <div className="col-12 col-lg-7">
          {/* Stage Progress Monitor */}
          {activeJob && (
            <div className="card shadow-sm border-0 p-4 mb-4" style={{ backgroundColor: '#17252A', borderRadius: '12px', color: '#FFFFFF' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 style={{ color: '#3AAFA9', fontWeight: 700, margin: 0 }}>
                  <i className="bi bi-activity me-2" />
                  Processing Pipeline Status
                </h5>
                <span
                  className="badge px-3 py-2"
                  style={{
                    backgroundColor: activeJob.status === 'completed' ? '#3AAFA9' : activeJob.status === 'failed' ? '#e74c3c' : '#2B7A78',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {activeJob.status} ({activeJob.stage_progress_pct}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="progress mb-4" style={{ height: '8px', backgroundColor: 'rgba(222, 242, 241, 0.2)' }}>
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{ width: `${activeJob.stage_progress_pct}%`, backgroundColor: '#3AAFA9' }}
                />
              </div>

              {/* Stage Stepper */}
              <div className="row g-2 text-center mb-3">
                {pipelineStages.map((st, idx) => {
                  const isCurrent = activeJob.current_stage === st.key;
                  const isPast = activeJob.stage_progress_pct >= (idx + 1) * 14;
                  return (
                    <div key={st.key} className="col">
                      <div
                        className="p-2 rounded"
                        style={{
                          backgroundColor: isCurrent ? '#2B7A78' : isPast ? 'rgba(58, 175, 169, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: isCurrent ? '1.5px solid #3AAFA9' : 'none',
                        }}
                      >
                        <i className={`bi ${st.icon} fs-5`} style={{ color: isCurrent || isPast ? '#3AAFA9' : '#DEF2F1' }} />
                        <div style={{ fontSize: '0.65rem', marginTop: '0.2rem', color: '#DEF2F1' }}>{st.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Note on Lip-Sync */}
              {activeJob.lipsync_status && (
                <div className="p-2 rounded mb-3 d-flex align-items-center gap-2" style={{ backgroundColor: 'rgba(43, 122, 120, 0.3)', fontSize: '0.8rem' }}>
                  <i className="bi bi-info-circle-fill" style={{ color: '#3AAFA9' }} />
                  <span><strong>Lip-Sync Status:</strong> {activeJob.lipsync_status} ({activeJob.faces_detected_count} face detections)</span>
                </div>
              )}

              {/* Console log stream */}
              <div
                className="p-3 rounded font-monospace"
                style={{
                  backgroundColor: '#0d1518',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  fontSize: '0.75rem',
                  color: '#3AAFA9',
                }}
              >
                {activeJob.processing_logs?.map((l, i) => (
                  <div key={i}>&gt; {l}</div>
                ))}
              </div>
            </div>
          )}

          {/* Export Center (When Completed) */}
          {activeJob?.status === 'completed' && (
            <div className="card shadow-sm border-0 p-4 mb-4" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
              <h5 style={{ color: '#17252A', fontWeight: 700, marginBottom: '1rem' }}>
                <i className="bi bi-check-circle-fill me-2" style={{ color: '#3AAFA9' }} />
                Export Center — Localized Assets
              </h5>

              {/* Video Player */}
              {activeJob.has_video && activeJob.output_video_storage_key && (
                <div className="mb-3">
                  <video
                    src={localizationService.getArtifactDownloadUrl(activeJob.id, 'video')}
                    controls
                    className="w-100 rounded"
                    style={{ maxHeight: '280px', backgroundColor: '#17252A' }}
                  />
                </div>
              )}

              {/* Dubbed Audio Player */}
              {activeJob.output_audio_storage_key && (
                <div className="mb-3">
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    Dubbed Audio Track ({activeJob.target_language.toUpperCase()}):
                  </div>
                  <audio
                    src={localizationService.getArtifactDownloadUrl(activeJob.id, 'audio')}
                    controls
                    className="w-100"
                  />
                </div>
              )}

              {/* Artifact Download Grid */}
              <div className="row g-2">
                {activeJob.output_video_storage_key && (
                  <div className="col-12 col-md-6">
                    <a
                      href={localizationService.getArtifactDownloadUrl(activeJob.id, 'video')}
                      download
                      className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                      style={{ backgroundColor: '#2B7A78', color: '#FFFFFF', borderRadius: '8px' }}
                    >
                      <i className="bi bi-file-earmark-play-fill" />
                      <span>Download Final Video (MP4)</span>
                    </a>
                  </div>
                )}
                <div className="col-12 col-md-6">
                  <a
                    href={localizationService.getArtifactDownloadUrl(activeJob.id, 'audio')}
                    download
                    className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: '#17252A', color: '#FFFFFF', borderRadius: '8px' }}
                  >
                    <i className="bi bi-file-earmark-music-fill" />
                    <span>Download Dubbed Audio (WAV)</span>
                  </a>
                </div>
                <div className="col-6">
                  <a
                    href={localizationService.getArtifactDownloadUrl(activeJob.id, 'srt')}
                    download
                    className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{ borderColor: '#2B7A78', color: '#2B7A78', borderRadius: '8px' }}
                  >
                    <i className="bi bi-card-text" />
                    <span>SubRip Subtitles (.SRT)</span>
                  </a>
                </div>
                <div className="col-6">
                  <a
                    href={localizationService.getArtifactDownloadUrl(activeJob.id, 'vtt')}
                    download
                    className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{ borderColor: '#2B7A78', color: '#2B7A78', borderRadius: '8px' }}
                  >
                    <i className="bi bi-badge-cc" />
                    <span>WebVTT Subtitles (.VTT)</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Timeline & Transcript Editor */}
          {activeJob?.segments && activeJob.segments.length > 0 && (
            <div className="card shadow-sm border-0 p-4" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 style={{ color: '#17252A', fontWeight: 700, margin: 0 }}>
                  <i className="bi bi-card-checklist me-2" style={{ color: '#3AAFA9' }} />
                  Timeline & Transcript Editor
                </h5>
                <span style={{ fontSize: '0.85rem', color: '#2B7A78' }}>
                  {activeJob.segments.length} Speech Segments Detected
                </span>
              </div>

              <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                {activeJob.segments.map((seg) => (
                  <div
                    key={seg.id}
                    className="p-3 mb-2 rounded border"
                    style={{
                      borderColor: '#2B7A78',
                      backgroundColor: activeSegmentIndex === seg.id ? '#DEF2F1' : '#FFFFFF',
                    }}
                    onClick={() => setActiveSegmentIndex(seg.id)}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge" style={{ backgroundColor: '#17252A' }}>
                        {seg.start.toFixed(2)}s - {seg.end.toFixed(2)}s
                      </span>
                      <span className="badge" style={{ backgroundColor: '#2B7A78' }}>
                        {seg.speaker}
                      </span>
                    </div>

                    <div className="mb-2">
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2B7A78' }}>Original Transcript:</label>
                      <div style={{ fontSize: '0.85rem', color: '#17252A' }}>{seg.original_text || seg.text}</div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3AAFA9' }}>Translated Dialogue:</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        defaultValue={seg.translated_text || seg.text}
                        onBlur={(e) => handleSegmentUpdate(seg.id, e.target.value, seg.speaker)}
                        style={{ borderColor: '#3AAFA9', borderRadius: '6px' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
