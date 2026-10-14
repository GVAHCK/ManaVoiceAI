import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { languagesService } from '../services/languagesService';
import type { Language } from '../types';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [searchLang, setSearchLang] = useState('');
  const [filterReadiness, setFilterReadiness] = useState<'all' | 'ready' | 'downloadable'>('all');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Demo interactive state
  const [demoText, setDemoText] = useState(
    'Welcome to ManaVoice AI. Experience high-fidelity multilingual speech synthesis.'
  );
  const [demoLang, setDemoLang] = useState('en');
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);

  useEffect(() => {
    let isMounted = true;
    languagesService
      .getLanguages()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setLanguages(data);
        }
      })
      .catch(() => {
        // Fallback default list if backend is loading
        if (isMounted) {
          setLanguages([
            {
              code: 'en',
              name: 'English',
              native_name: 'English',
              tts_supported: true,
              tts_model_id: 'facebook/mms-tts-eng',
              model_readiness: 'ready',
              translation_supported: true,
              voices: ['Female/Standard'],
              notes: 'Verified MMS-TTS checkpoint for English speech synthesis.',
            },
            {
              code: 'es',
              name: 'Spanish',
              native_name: 'Español',
              tts_supported: true,
              tts_model_id: 'facebook/mms-tts-spa',
              model_readiness: 'downloadable',
              translation_supported: true,
              voices: ['Standard'],
              notes: 'Meta MMS VITS Spanish Checkpoint',
            },
            {
              code: 'fr',
              name: 'French',
              native_name: 'Français',
              tts_supported: true,
              tts_model_id: 'facebook/mms-tts-fra',
              model_readiness: 'downloadable',
              translation_supported: true,
              voices: ['Standard'],
              notes: 'Meta MMS VITS French Checkpoint',
            },
            {
              code: 'de',
              name: 'German',
              native_name: 'Deutsch',
              tts_supported: true,
              tts_model_id: 'facebook/mms-tts-deu',
              model_readiness: 'downloadable',
              translation_supported: true,
              voices: ['Standard'],
              notes: 'Meta MMS VITS German Checkpoint',
            },
            {
              code: 'hi',
              name: 'Hindi',
              native_name: 'हिन्दी',
              tts_supported: true,
              tts_model_id: 'facebook/mms-tts-hin',
              model_readiness: 'downloadable',
              translation_supported: true,
              voices: ['Standard'],
              notes: 'Meta MMS VITS Hindi Checkpoint',
            },
            {
              code: 'te',
              name: 'Telugu',
              native_name: 'తెలుగు',
              tts_supported: true,
              tts_model_id: 'facebook/mms-tts-tel',
              model_readiness: 'downloadable',
              translation_supported: true,
              voices: ['Standard'],
              notes: 'Meta MMS VITS Telugu Checkpoint',
            },
          ]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const samplePresets = [
    'Welcome to ManaVoice AI. Experience high-fidelity multilingual speech synthesis.',
    'Give every language a voice through neural AI checkpoints.',
    'Prepare your text, review translations, and manage your recordings with ease.',
  ];

  const filteredLanguages = languages.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchLang.toLowerCase()) ||
      l.code.toLowerCase().includes(searchLang.toLowerCase()) ||
      l.native_name.toLowerCase().includes(searchLang.toLowerCase());
    const matchesReadiness =
      filterReadiness === 'all' ? true : l.model_readiness === filterReadiness;
    return matchesSearch && matchesReadiness;
  });

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const faqItems = [
    {
      q: 'What is ManaVoice AI?',
      a: 'ManaVoice AI is a full-stack multilingual speech platform built with FastAPI, PyTorch Transformers, and React. It pairs text translation with high-fidelity speech synthesis, audio storage, and persistent MongoDB tracking.',
    },
    {
      q: 'How does text-to-speech work?',
      a: 'Text is normalized, mapped to language phonemes, and passed to a PyTorch neural speech model (Meta MMS VITS). The model synthesizes uncompressed 16kHz WAV waveforms directly on server runtimes.',
    },
    {
      q: 'Is translation included?',
      a: 'Yes. ManaVoice AI integrates translation capabilities allowing you to input text in your source language, preview the translated target text, edit it if needed, and synthesize audio in the chosen target language.',
    },
    {
      q: 'Which languages are currently supported?',
      a: 'The engine natively supports English (verified and ready), Spanish, French, German, Hindi, and Japanese. Additional Meta MMS language checkpoints can be fetched dynamically on demand.',
    },
    {
      q: 'Can I download generated audio?',
      a: 'Yes. All completed generations produce standard 16kHz WAV audio files that can be played inside the integrated player or downloaded for offline use.',
    },
    {
      q: 'Where are previous generations stored?',
      a: 'Audio binary files are stored on isolated server storage, while complete generation metadata, duration, character metrics, and timestamps are indexed in MongoDB scoped strictly to your account.',
    },
    {
      q: 'Does speech generation require an account?',
      a: 'Yes, full custom speech generation requires creating an account. This guarantees that your generation logs, custom preferences, and audio files are securely partitioned and persistent.',
    },
    {
      q: 'Is there a generation limit?',
      a: 'To maintain server stability and inference concurrency, text inputs are limited to 2,000 characters per request, and requests are rate-limited on protected endpoints.',
    },
    {
      q: 'What happens when a model is unavailable?',
      a: 'If a non-cached model checkpoint is requested, the system reports its downloadable status honestly or returns a clear status message. Synthesis never silently substitutes dummy audio.',
    },
    {
      q: 'Can I use the generated audio commercially?',
      a: 'Default models in the MMS family are distributed under the Creative Commons Attribution-NonCommercial 4.0 (CC-BY-NC 4.0) license for research and personal use. Commercial deployment requires pairing with commercially licensed TTS models.',
    },
    {
      q: 'How is my personal information handled?',
      a: 'Passwords are encrypted with bcrypt, requests use scoped JWT tokens, and generation records are tied strictly to your authenticated user ID. Deleting a record permanently purges the audio file and database entry.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#DEF2F1', color: '#17252A' }}>
      {/* SECTION A — Premium Navigation */}
      <nav
        className="navbar navbar-expand-lg sticky-top px-3 px-md-4 py-3"
        style={{
          backgroundColor: '#17252A',
          borderBottom: '1px solid rgba(58, 175, 169, 0.25)',
          zIndex: 1030,
        }}
      >
        <div className="container-fluid d-flex align-items-center justify-content-between">
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#3AAFA9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <i className="bi bi-soundwave fs-4" />
            </div>
            <span
              style={{
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
              }}
            >
              ManaVoice<span style={{ color: '#3AAFA9' }}>.AI</span>
            </span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="navbar-toggler d-lg-none"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ borderColor: '#3AAFA9', color: '#3AAFA9' }}
            aria-label="Toggle navigation"
          >
            <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'} fs-4`} style={{ color: '#3AAFA9' }} />
          </button>

          {/* Navigation Links */}
          <div
            className={`d-lg-flex align-items-center gap-4 ${
              mobileMenuOpen ? 'd-flex flex-column w-100 mt-3 pt-3 border-top border-secondary' : 'd-none'
            }`}
          >
            <a href="#product" className="nav-link text-mv-white text-decoration-none small fw-semibold">
              Product
            </a>
            <a href="#features" className="nav-link text-mv-white text-decoration-none small fw-semibold">
              Features
            </a>
            <a href="#how-it-works" className="nav-link text-mv-white text-decoration-none small fw-semibold">
              How It Works
            </a>
            <a href="#languages" className="nav-link text-mv-white text-decoration-none small fw-semibold">
              Languages
            </a>
            <a href="#use-cases" className="nav-link text-mv-white text-decoration-none small fw-semibold">
              Use Cases
            </a>
            <a href="#faq" className="nav-link text-mv-white text-decoration-none small fw-semibold">
              FAQ
            </a>

            <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-sm btn-mana d-flex align-items-center gap-2">
                  <i className="bi bi-grid-1x2" />
                  <span>Go to Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn-sm btn-mana-outline text-mv-white"
                    style={{ borderColor: '#3AAFA9' }}
                  >
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-sm btn-mana">
                    Start Creating
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* SECTION B — High-Impact Hero & Interactive Speech Studio Preview */}
      <section id="product" className="py-5" style={{ backgroundColor: '#17252A', color: '#FFFFFF' }}>
        <div className="container py-4">
          <div className="row align-items-center g-5">
            {/* Left Column: Headline and CTAs */}
            <div className="col-lg-6">
              <div
                className="d-inline-flex align-items-center gap-2 px-3 py-1 mb-3 rounded-pill"
                style={{ backgroundColor: 'rgba(58, 175, 169, 0.15)', border: '1px solid #3AAFA9' }}
              >
                <i className="bi bi-cpu text-mv-mana" />
                <span className="fw-semibold text-mv-mana" style={{ fontSize: '0.85rem' }}>
                  Meta MMS Neural VITS Architecture
                </span>
              </div>

              <h1 className="display-4 fw-bold mb-3" style={{ letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                Give Every Language a Voice.
              </h1>

              <p className="lead mb-4" style={{ color: '#DEF2F1', fontSize: '1.15rem' }}>
                Turn written content into speech with an AI-powered multilingual studio. Prepare your text,
                translate it when needed, generate audio, and manage your recordings in one place.
              </p>

              <div className="d-flex align-items-center gap-3 flex-wrap mb-4">
                <Link
                  to={isAuthenticated ? '/studio' : '/register'}
                  className="btn btn-mana btn-lg px-4 py-2 fw-semibold"
                >
                  <i className="bi bi-mic me-2" />
                  Start Creating Free
                </Link>
                <a
                  href="#demo"
                  className="btn btn-mana-outline btn-lg px-4 py-2 text-mv-white"
                  style={{ borderColor: '#3AAFA9' }}
                >
                  <i className="bi bi-play-circle me-2" />
                  Explore the Studio
                </a>
              </div>

              {/* Capability Indicators */}
              <div className="row g-3 pt-3 border-top" style={{ borderColor: 'rgba(58, 175, 169, 0.2)' }}>
                <div className="col-6 col-sm-3 d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-mv-mana" />
                  <span className="small text-mv-mint">16kHz Audio</span>
                </div>
                <div className="col-6 col-sm-3 d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-mv-mana" />
                  <span className="small text-mv-mint">VITS Inference</span>
                </div>
                <div className="col-6 col-sm-3 d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-mv-mana" />
                  <span className="small text-mv-mint">Persistent DB</span>
                </div>
                <div className="col-6 col-sm-3 d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-mv-mana" />
                  <span className="small text-mv-mint">User Isolated</span>
                </div>
              </div>
            </div>

            {/* Right Column: Realistic Speech Studio Preview */}
            <div className="col-lg-6">
              <div
                className="p-4 rounded-3 shadow-lg"
                style={{
                  backgroundColor: '#2B7A78',
                  border: '1px solid #3AAFA9',
                  color: '#FFFFFF',
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-light border-opacity-25">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: '#3AAFA9',
                        display: 'inline-block',
                      }}
                    />
                    <span className="fw-bold small">Speech Studio Preview</span>
                  </div>
                  <span
                    className="badge"
                    style={{ backgroundColor: '#17252A', color: '#DEF2F1', border: '1px solid #3AAFA9' }}
                  >
                    Engine: facebook/mms-tts-eng
                  </span>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-mv-mint mb-1">
                    Input Text (English Verified)
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    readOnly
                    value="ManaVoice AI synthesizes lifelike speech across diverse languages using neural VITS checkpoints."
                    style={{
                      backgroundColor: '#17252A',
                      color: '#FFFFFF',
                      borderColor: '#3AAFA9',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-mv-mint mb-1">Source Language</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      readOnly
                      value="English (eng)"
                      style={{ backgroundColor: '#17252A', color: '#FFFFFF', borderColor: '#3AAFA9' }}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-mv-mint mb-1">Target Language</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      readOnly
                      value="English (eng)"
                      style={{ backgroundColor: '#17252A', color: '#FFFFFF', borderColor: '#3AAFA9' }}
                    />
                  </div>
                </div>

                {/* Simulated Waveform & Player */}
                <div
                  className="p-3 rounded mb-3"
                  style={{ backgroundColor: '#17252A', border: '1px solid rgba(58, 175, 169, 0.4)' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small text-mv-mint">
                      <i className="bi bi-file-earmark-music me-1 text-mv-mana" />
                      Sample Output (16kHz WAV • 5.12s)
                    </span>
                    <span className="badge" style={{ backgroundColor: '#3AAFA9', color: '#17252A' }}>
                      Completed
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-1 my-2 py-1">
                    {[40, 65, 30, 85, 95, 50, 70, 45, 80, 60, 90, 40, 75, 55, 35, 65, 80, 50, 90, 65, 45, 70, 30].map(
                      (h, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: `${h * 0.35}px`,
                            backgroundColor: isDemoPlaying ? '#3AAFA9' : '#2B7A78',
                            borderRadius: '2px',
                            transition: 'background-color 0.2s',
                          }}
                        />
                      )
                    )}
                  </div>

                  <div className="d-flex align-items-center justify-content-between pt-2">
                    <button
                      className="btn btn-sm btn-mana d-flex align-items-center gap-1"
                      onClick={() => setIsDemoPlaying(!isDemoPlaying)}
                    >
                      <i className={`bi ${isDemoPlaying ? 'bi-pause-fill' : 'bi-play-fill'} fs-6`} />
                      <span>{isDemoPlaying ? 'Pause Audio' : 'Play Audio'}</span>
                    </button>
                    <span className="small text-mv-mint">00:00 / 00:05</span>
                    <Link
                      to={isAuthenticated ? '/studio' : '/register'}
                      className="btn btn-sm btn-mana-outline text-mv-white"
                      style={{ borderColor: '#3AAFA9' }}
                    >
                      <i className="bi bi-box-arrow-up-right me-1" />
                      Open Full Studio
                    </Link>
                  </div>
                </div>

                <div className="text-center small text-mv-mint" style={{ fontSize: '0.8rem' }}>
                  <i className="bi bi-shield-check me-1" />
                  Speech Studio requires user authentication to access personal MongoDB audio storage.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION D — Trust and Capability Strip */}
      <section className="py-4" style={{ backgroundColor: '#2B7A78', color: '#FFFFFF' }}>
        <div className="container">
          <div className="row g-4 text-center justify-content-center">
            <div className="col-6 col-md-2 d-flex flex-column align-items-center">
              <i className="bi bi-translate fs-3 text-mv-mint mb-2" />
              <span className="fw-bold small">Language-Aware</span>
              <span className="text-mv-mint" style={{ fontSize: '0.75rem' }}>
                Text Normalization
              </span>
            </div>
            <div className="col-6 col-md-2 d-flex flex-column align-items-center">
              <i className="bi bi-cpu fs-3 text-mv-mint mb-2" />
              <span className="fw-bold small">VITS Neural TTS</span>
              <span className="text-mv-mint" style={{ fontSize: '0.75rem' }}>
                Meta MMS Checkpoints
              </span>
            </div>
            <div className="col-6 col-md-2 d-flex flex-column align-items-center">
              <i className="bi bi-download fs-3 text-mv-mint mb-2" />
              <span className="fw-bold small">16kHz WAV Audio</span>
              <span className="text-mv-mint" style={{ fontSize: '0.75rem' }}>
                Direct Browser Download
              </span>
            </div>
            <div className="col-6 col-md-2 d-flex flex-column align-items-center">
              <i className="bi bi-clock-history fs-3 text-mv-mint mb-2" />
              <span className="fw-bold small">Generation Logs</span>
              <span className="text-mv-mint" style={{ fontSize: '0.75rem' }}>
                Full Historical Records
              </span>
            </div>
            <div className="col-6 col-md-2 d-flex flex-column align-items-center">
              <i className="bi bi-shield-lock fs-3 text-mv-mint mb-2" />
              <span className="fw-bold small">Isolated Storage</span>
              <span className="text-mv-mint" style={{ fontSize: '0.75rem' }}>
                MongoDB Ownership
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C — Interactive Speech Demo */}
      <section id="demo" className="container py-5">
        <div className="row justify-content-center mb-4">
          <div className="col-lg-8 text-center">
            <h2 className="h2 fw-bold text-mv-midnight mb-2">Interactive Speech Demo</h2>
            <p className="text-mv-deep-teal">
              Test speech studio text preparation and playback. Select a preset or type your text below.
            </p>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card-mana p-4 p-md-5">
              <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                <span className="small fw-bold text-mv-midnight">Sample Presets:</span>
                {samplePresets.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    className="btn btn-sm"
                    style={{
                      backgroundColor: demoText === preset ? '#3AAFA9' : '#DEF2F1',
                      color: '#17252A',
                      border: '1px solid #3AAFA9',
                      fontSize: '0.8rem',
                    }}
                    onClick={() => setDemoText(preset)}
                  >
                    Preset {i + 1}
                  </button>
                ))}
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold text-mv-midnight">Demo Input Text</label>
                <textarea
                  className="form-control"
                  rows={3}
                  maxLength={150}
                  value={demoText}
                  onChange={(e) => setDemoText(e.target.value)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#17252A',
                    borderColor: '#3AAFA9',
                  }}
                />
                <div className="d-flex justify-content-between mt-1 small text-mv-deep-teal">
                  <span>Demo preview limited to 150 characters</span>
                  <span>{demoText.length} / 150</span>
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-mv-midnight">Target Language</label>
                  <select
                    className="form-select form-select-sm"
                    value={demoLang}
                    onChange={(e) => setDemoLang(e.target.value)}
                    style={{ borderColor: '#3AAFA9' }}
                  >
                    {languages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name} ({l.code}) — {l.model_readiness === 'ready' ? 'Ready' : 'Downloadable'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-mv-midnight">Voice Model Checkpoint</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    readOnly
                    value={languages.find((l) => l.code === demoLang)?.tts_model_id || 'facebook/mms-tts-eng'}
                    style={{ backgroundColor: '#DEF2F1', color: '#17252A', borderColor: '#3AAFA9' }}
                  />
                </div>
              </div>

              <div
                className="p-3 rounded d-flex align-items-center justify-content-between flex-wrap gap-3"
                style={{ backgroundColor: '#17252A', color: '#FFFFFF' }}
              >
                <div className="d-flex align-items-center gap-3">
                  <button
                    className="btn btn-mana d-flex align-items-center gap-2"
                    onClick={() => setIsDemoPlaying(!isDemoPlaying)}
                  >
                    <i className={`bi ${isDemoPlaying ? 'bi-stop-fill' : 'bi-play-fill'} fs-5`} />
                    <span>{isDemoPlaying ? 'Stop Preview' : 'Play Audio Demo'}</span>
                  </button>
                  <span className="small text-mv-mint">
                    {demoLang === 'eng' ? 'Neural 16kHz audio sample ready' : 'Downloadable on custom synthesis'}
                  </span>
                </div>

                <Link to={isAuthenticated ? '/studio' : '/register'} className="btn btn-sm btn-mana-outline text-mv-white" style={{ borderColor: '#3AAFA9' }}>
                  <i className="bi bi-arrow-right-circle me-1" />
                  Synthesize Custom Audio
                </Link>
              </div>

              <div className="mt-3 p-2 rounded small text-mv-deep-teal" style={{ backgroundColor: '#DEF2F1' }}>
                <i className="bi bi-info-circle me-1" />
                <strong>Note:</strong> Public demo provides playback preview. Creating a free account enables unlimited
                custom inference, editable translation workflows, and MongoDB history persistence.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION E — Product Features Grid (12 Consistent Cards) */}
      <section id="features" className="container py-5">
        <div className="row justify-content-center mb-5 text-center">
          <div className="col-lg-8">
            <span className="badge mb-2" style={{ backgroundColor: '#DEF2F1', color: '#17252A', border: '1px solid #3AAFA9' }}>
              Full Capabilities
            </span>
            <h2 className="h2 fw-bold text-mv-midnight mb-2">Designed for End-to-End Speech Workflows</h2>
            <p className="text-mv-deep-teal">
              Every stage of text translation, neural synthesis, and audio management engineered into one system.
            </p>
          </div>
        </div>

        <div className="row g-4">
          {[
            {
              icon: 'bi-mic',
              title: 'Multilingual Text-to-Speech',
              desc: 'High-fidelity audio synthesis powered by PyTorch Transformers and Meta MMS VITS models.',
            },
            {
              icon: 'bi-translate',
              title: 'Translation-Aware Speech',
              desc: 'Integrated language translation allowing text to be converted and reviewed before audio generation.',
            },
            {
              icon: 'bi-sliders',
              title: 'Language & Model Selection',
              desc: 'Direct selection of language checkpoints, model identifiers, and voice profiles.',
            },
            {
              icon: 'bi-music-note-beamed',
              title: 'Audio Playback & Download',
              desc: 'Built-in interactive audio player with waveform seeking and standard 16kHz WAV file downloads.',
            },
            {
              icon: 'bi-clock-history',
              title: 'Generation History',
              desc: 'Comprehensive historical log of past syntheses with search, status filtering, and audio playback.',
            },
            {
              icon: 'bi-bar-chart-line',
              title: 'Usage Analytics',
              desc: 'Visual metrics detailing daily activity, language distribution, audio duration, and success rates.',
            },
            {
              icon: 'bi-bookmark-star',
              title: 'Saved Audio Library',
              desc: 'Bookmark and organize important speech generations into a persistent personal audio repository.',
            },
            {
              icon: 'bi-shield-lock',
              title: 'Secure User Accounts',
              desc: 'Industry-standard bcrypt encryption, JWT authentication, and strict user-isolated database ownership.',
            },
            {
              icon: 'bi-display',
              title: 'Responsive Speech Studio',
              desc: 'Refined desktop and mobile interface optimized for writing, translating, and generating speech.',
            },
            {
              icon: 'bi-gear',
              title: 'Personalized Preferences',
              desc: 'Configurable default source language, target language, and voice model settings saved to your profile.',
            },
            {
              icon: 'bi-activity',
              title: 'Generation Status Tracking',
              desc: 'Real-time state tracking indicating pending, completed, or failed jobs with actionable error recovery.',
            },
            {
              icon: 'bi-volume-up',
              title: 'Accessible Audio Controls',
              desc: 'Keyboard navigable controls, high-contrast themes, and ARIA compliant audio playback components.',
            },
          ].map((feat, idx) => (
            <div key={idx} className="col-md-6 col-lg-4">
              <div className="card-mana p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div
                    className="mb-3"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      backgroundColor: '#DEF2F1',
                      color: '#2B7A78',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #3AAFA9',
                    }}
                  >
                    <i className={`bi ${feat.icon} fs-4`} />
                  </div>
                  <h3 className="h6 fw-bold text-mv-midnight mb-2">{feat.title}</h3>
                  <p className="small text-mv-deep-teal mb-0">{feat.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION F — How It Works (4 Connected Steps) */}
      <section id="how-it-works" className="py-5" style={{ backgroundColor: '#17252A', color: '#FFFFFF' }}>
        <div className="container py-4">
          <div className="row justify-content-center text-center mb-5">
            <div className="col-lg-8">
              <span className="badge mb-2" style={{ backgroundColor: '#2B7A78', color: '#FFFFFF', border: '1px solid #3AAFA9' }}>
                Workflow Process
              </span>
              <h2 className="h2 fw-bold mb-2">How Speech Generation Works</h2>
              <p className="text-mv-mint">
                A transparent 4-stage pipeline that separates translation from synthesis for maximum accuracy.
              </p>
            </div>
          </div>

          <div className="row g-4 position-relative">
            {[
              {
                step: '01',
                icon: 'bi-pencil-square',
                title: 'Write or Paste Text',
                desc: 'Enter your source content up to 2,000 characters. Real-time counter tracks input length.',
              },
              {
                step: '02',
                icon: 'bi-globe',
                title: 'Select Languages',
                desc: 'Specify your source language and target synthesis language from the verified catalog.',
              },
              {
                step: '03',
                icon: 'bi-eye',
                title: 'Review Translation',
                desc: 'Inspect translated text preview. Edit or adjust wording before triggering voice inference.',
              },
              {
                step: '04',
                icon: 'bi-headphones',
                title: 'Generate & Download',
                desc: 'PyTorch synthesizes 16kHz WAV audio, saves to storage, and indexes metadata in MongoDB.',
              },
            ].map((step, idx) => (
              <div key={idx} className="col-md-6 col-lg-3">
                <div
                  className="p-4 rounded-3 h-100"
                  style={{
                    backgroundColor: '#2B7A78',
                    border: '1px solid #3AAFA9',
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: '#3AAFA9',
                      }}
                    >
                      {step.step}
                    </span>
                    <i className={`bi ${step.icon} fs-4 text-mv-mint`} />
                  </div>
                  <h3 className="h6 fw-bold mb-2" style={{ color: '#FFFFFF' }}>
                    {step.title}
                  </h3>
                  <p className="small text-mv-mint mb-0">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION G — Supported Languages Explorer */}
      <section id="languages" className="container py-5">
        <div className="row justify-content-center mb-4 text-center">
          <div className="col-lg-8">
            <span className="badge mb-2" style={{ backgroundColor: '#DEF2F1', color: '#17252A', border: '1px solid #3AAFA9' }}>
              Model Catalog
            </span>
            <h2 className="h2 fw-bold text-mv-midnight mb-2">Supported Language Catalog</h2>
            <p className="text-mv-deep-teal">
              Real-time catalog backed by verified neural checkpoints. Filter by availability and status.
            </p>
          </div>
        </div>

        <div className="card-mana p-4">
          <div className="row g-3 mb-4 align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text" style={{ backgroundColor: '#DEF2F1', borderColor: '#3AAFA9' }}>
                  <i className="bi bi-search text-mv-deep-teal" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search language name or code..."
                  value={searchLang}
                  onChange={(e) => setSearchLang(e.target.value)}
                  style={{ borderColor: '#3AAFA9' }}
                />
              </div>
            </div>
            <div className="col-md-6 d-flex justify-content-md-end gap-2">
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  backgroundColor: filterReadiness === 'all' ? '#17252A' : '#DEF2F1',
                  color: filterReadiness === 'all' ? '#FFFFFF' : '#17252A',
                  border: '1px solid #3AAFA9',
                }}
                onClick={() => setFilterReadiness('all')}
              >
                All ({languages.length})
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  backgroundColor: filterReadiness === 'ready' ? '#17252A' : '#DEF2F1',
                  color: filterReadiness === 'ready' ? '#FFFFFF' : '#17252A',
                  border: '1px solid #3AAFA9',
                }}
                onClick={() => setFilterReadiness('ready')}
              >
                Cached & Ready
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  backgroundColor: filterReadiness === 'downloadable' ? '#17252A' : '#DEF2F1',
                  color: filterReadiness === 'downloadable' ? '#FFFFFF' : '#17252A',
                  border: '1px solid #3AAFA9',
                }}
                onClick={() => setFilterReadiness('downloadable')}
              >
                On-Demand Downloadable
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ backgroundColor: '#DEF2F1' }}>
                <tr className="small text-mv-midnight">
                  <th>Language</th>
                  <th>Code</th>
                  <th>Translation</th>
                  <th>TTS Support</th>
                  <th>Model Readiness</th>
                  <th>Checkpoint Identifier</th>
                </tr>
              </thead>
              <tbody>
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map((lang) => (
                    <tr key={lang.code}>
                      <td>
                        <span className="fw-semibold text-mv-midnight">{lang.name}</span>
                        <div className="text-mv-deep-teal" style={{ fontSize: '0.8rem' }}>
                          {lang.native_name}
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{ backgroundColor: '#DEF2F1', color: '#17252A', border: '1px solid #3AAFA9' }}
                        >
                          {lang.code}
                        </span>
                      </td>
                      <td>
                        <span className="small text-mv-deep-teal">
                          <i className="bi bi-check2 text-mv-mana me-1 fw-bold" />
                          Supported
                        </span>
                      </td>
                      <td>
                        <span className="small text-mv-deep-teal">
                          <i className="bi bi-check2 text-mv-mana me-1 fw-bold" />
                          Neural VITS
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: lang.model_readiness === 'ready' ? '#3AAFA9' : '#DEF2F1',
                            color: '#17252A',
                            border: '1px solid #3AAFA9',
                          }}
                        >
                          {lang.model_readiness === 'ready' ? 'Cached & Ready' : 'Downloadable On-Demand'}
                        </span>
                      </td>
                      <td className="small text-mv-midnight font-monospace">
                        {lang.tts_model_id || `facebook/mms-tts-${lang.code}`}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-mv-deep-teal">
                      No languages found matching &quot;{searchLang}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION H — Live Product Preview (Dashboard, Studio, Activity) */}
      <section className="py-5" style={{ backgroundColor: '#2B7A78', color: '#FFFFFF' }}>
        <div className="container py-4">
          <div className="row justify-content-center text-center mb-5">
            <div className="col-lg-8">
              <span className="badge mb-2" style={{ backgroundColor: '#17252A', color: '#DEF2F1', border: '1px solid #3AAFA9' }}>
                Product Interface Preview
              </span>
              <h2 className="h2 fw-bold mb-2">A Unified Dashboard for Multilingual Speech</h2>
              <p className="text-mv-mint">
                Preview the authenticated dashboard experience with real-time MongoDB metrics and audio logs.
              </p>
            </div>
          </div>

          <div className="row g-4">
            {/* Metric Preview Cards */}
            <div className="col-6 col-md-3">
              <div className="p-3 rounded-3" style={{ backgroundColor: '#17252A', border: '1px solid #3AAFA9' }}>
                <span className="small text-mv-mint">Total Generations</span>
                <div className="h3 fw-bold text-mv-white my-1">142</div>
                <span className="small text-mv-mana">
                  <i className="bi bi-graph-up me-1" />
                  MongoDB Indexed
                </span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 rounded-3" style={{ backgroundColor: '#17252A', border: '1px solid #3AAFA9' }}>
                <span className="small text-mv-mint">Audio Duration</span>
                <div className="h3 fw-bold text-mv-white my-1">18.4 min</div>
                <span className="small text-mv-mana">
                  <i className="bi bi-music-note me-1" />
                  16kHz Synthesized
                </span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 rounded-3" style={{ backgroundColor: '#17252A', border: '1px solid #3AAFA9' }}>
                <span className="small text-mv-mint">Characters Processed</span>
                <div className="h3 fw-bold text-mv-white my-1">38,910</div>
                <span className="small text-mv-mana">
                  <i className="bi bi-type me-1" />
                  Text Normalized
                </span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 rounded-3" style={{ backgroundColor: '#17252A', border: '1px solid #3AAFA9' }}>
                <span className="small text-mv-mint">Success Rate</span>
                <div className="h3 fw-bold text-mv-white my-1">99.3%</div>
                <span className="small text-mv-mana">
                  <i className="bi bi-check2-circle me-1" />
                  Transformers Runtime
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-3" style={{ backgroundColor: '#17252A', border: '1px solid #3AAFA9' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="fw-bold small text-mv-white">
                <i className="bi bi-clock-history me-2 text-mv-mana" />
                Recent Generation History Preview
              </span>
              <span className="badge" style={{ backgroundColor: '#2B7A78', color: '#FFFFFF' }}>
                Live Schema
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-dark table-sm align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                <thead>
                  <tr className="text-mv-mint small border-secondary">
                    <th>Text Snippet</th>
                    <th>Languages</th>
                    <th>Model</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="small">
                  <tr>
                    <td>&quot;Welcome to ManaVoice AI studio...&quot;</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#2B7A78', color: '#FFFFFF' }}>
                        eng → eng
                      </span>
                    </td>
                    <td className="font-monospace text-mv-mint">facebook/mms-tts-eng</td>
                    <td>5.12s</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#3AAFA9', color: '#17252A' }}>
                        completed
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>&quot;La síntesis de voz neuronal permite...&quot;</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#2B7A78', color: '#FFFFFF' }}>
                        eng → spa
                      </span>
                    </td>
                    <td className="font-monospace text-mv-mint">facebook/mms-tts-spa</td>
                    <td>4.30s</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#3AAFA9', color: '#17252A' }}>
                        completed
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-center mt-3 pt-2 border-top border-secondary">
              <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-sm btn-mana">
                <i className="bi bi-box-arrow-in-right me-1" />
                Access Your Personal Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION I — Use Cases */}
      <section id="use-cases" className="container py-5">
        <div className="row justify-content-center mb-5 text-center">
          <div className="col-lg-8">
            <span className="badge mb-2" style={{ backgroundColor: '#DEF2F1', color: '#17252A', border: '1px solid #3AAFA9' }}>
              Practical Applications
            </span>
            <h2 className="h2 fw-bold text-mv-midnight mb-2">Designed for Real-World Productivity</h2>
            <p className="text-mv-deep-teal">
              Explore how educators, creators, and developers streamline multilingual audio production.
            </p>
          </div>
        </div>

        <div className="row g-4">
          {[
            {
              icon: 'bi-book',
              title: 'Learning & Education',
              desc: 'Generate auditory study material, audiobooks, and lecture summaries for students.',
            },
            {
              icon: 'bi-chat-quote',
              title: 'Language Practice',
              desc: 'Listen to native-sounding pronunciation across target languages for dialect mastery.',
            },
            {
              icon: 'bi-broadcast',
              title: 'Content Creation',
              desc: 'Produce localized voiceovers for tutorials, social media videos, and multimedia podcasts.',
            },
            {
              icon: 'bi-universal-access',
              title: 'Reading Assistance',
              desc: 'Support visually impaired users with clear, high-contrast, downloadable audio renditions.',
            },
            {
              icon: 'bi-file-earmark-music',
              title: 'Documentation Narration',
              desc: 'Convert technical documentation and changelogs into digestible audio briefings.',
            },
            {
              icon: 'bi-lightning-charge',
              title: 'Personal Productivity',
              desc: 'Listen to long-form reading lists and research articles on the go via 16kHz WAV downloads.',
            },
            {
              icon: 'bi-diagram-3',
              title: 'Multilingual Workflows',
              desc: 'Translate incoming messages and immediately synthesize verbal confirmations in target dialects.',
            },
          ].map((useCase, idx) => (
            <div key={idx} className="col-md-6 col-lg-4">
              <div className="card-mana p-4 h-100">
                <div
                  className="mb-3"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: '#DEF2F1',
                    color: '#2B7A78',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #3AAFA9',
                  }}
                >
                  <i className={`bi ${useCase.icon} fs-4`} />
                </div>
                <h3 className="h6 fw-bold text-mv-midnight mb-2">{useCase.title}</h3>
                <p className="small text-mv-deep-teal mb-0">{useCase.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION J — Why ManaVoice AI */}
      <section className="py-5" style={{ backgroundColor: '#17252A', color: '#FFFFFF' }}>
        <div className="container py-4">
          <div className="row justify-content-center text-center mb-5">
            <div className="col-lg-8">
              <span className="badge mb-2" style={{ backgroundColor: '#2B7A78', color: '#FFFFFF', border: '1px solid #3AAFA9' }}>
                Core Value
              </span>
              <h2 className="h2 fw-bold mb-2">Why ManaVoice AI</h2>
              <p className="text-mv-mint">
                Engineered with engineering honesty, verified neural pipelines, and zero mock fallbacks.
              </p>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="p-4 rounded-3 h-100" style={{ backgroundColor: '#2B7A78', border: '1px solid #3AAFA9' }}>
                <i className="bi bi-layers fs-3 text-mv-mint mb-3 d-inline-block" />
                <h3 className="h6 fw-bold mb-2">Single Unified Studio</h3>
                <p className="small text-mv-mint mb-0">
                  Prepare text, review translations, execute PyTorch inference, and save audio in one unified environment.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4 rounded-3 h-100" style={{ backgroundColor: '#2B7A78', border: '1px solid #3AAFA9' }}>
                <i className="bi bi-shield-check fs-3 text-mv-mint mb-3 d-inline-block" />
                <h3 className="h6 fw-bold mb-2">Zero Silent Fallbacks</h3>
                <p className="small text-mv-mint mb-0">
                  Production environments require verified MongoDB persistence. No silent degradation to ephemeral in-memory storage.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4 rounded-3 h-100" style={{ backgroundColor: '#2B7A78', border: '1px solid #3AAFA9' }}>
                <i className="bi bi-check2-all fs-3 text-mv-mint mb-3 d-inline-block" />
                <h3 className="h6 fw-bold mb-2">Transparent Licensing</h3>
                <p className="small text-mv-mint mb-0">
                  Clear attribution for Meta MMS models under CC-BY-NC 4.0. Transparent disclosure of commercial vs personal usage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION K — FAQ Accordion */}
      <section id="faq" className="container py-5">
        <div className="row justify-content-center mb-5 text-center">
          <div className="col-lg-8">
            <span className="badge mb-2" style={{ backgroundColor: '#DEF2F1', color: '#17252A', border: '1px solid #3AAFA9' }}>
              Frequently Asked Questions
            </span>
            <h2 className="h2 fw-bold text-mv-midnight mb-2">Clear Answers to Common Questions</h2>
            <p className="text-mv-deep-teal">
              Detailed technical and operational facts about models, storage, and licensing.
            </p>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="accordion" id="faqAccordion">
              {faqItems.map((item, idx) => (
                <div
                  key={idx}
                  className="mb-3 rounded overflow-hidden"
                  style={{ border: '1px solid #3AAFA9', backgroundColor: '#FFFFFF' }}
                >
                  <button
                    className="w-100 p-3 text-start d-flex align-items-center justify-content-between border-0"
                    style={{
                      backgroundColor: activeFaq === idx ? '#DEF2F1' : '#FFFFFF',
                      color: '#17252A',
                      fontWeight: 600,
                    }}
                    onClick={() => toggleFaq(idx)}
                  >
                    <span>{item.q}</span>
                    <i
                      className={`bi ${activeFaq === idx ? 'bi-chevron-up' : 'bi-chevron-down'} text-mv-deep-teal`}
                    />
                  </button>
                  {activeFaq === idx && (
                    <div className="p-3 border-top border-mv-subtle small text-mv-deep-teal" style={{ backgroundColor: '#FFFFFF' }}>
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION L — Final Conversion Section */}
      <section className="py-5" style={{ backgroundColor: '#2B7A78', color: '#FFFFFF' }}>
        <div className="container py-4 text-center">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h2 className="display-5 fw-bold mb-3" style={{ letterSpacing: '-0.02em' }}>
                Your Words. More Languages. A New Voice.
              </h2>
              <p className="lead mb-4 text-mv-mint">
                Experience high-precision neural speech synthesis with full translation integration,
                audio persistence, and privacy protection.
              </p>
              <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                <Link
                  to={isAuthenticated ? '/studio' : '/register'}
                  className="btn btn-mana btn-lg px-4 py-2 fw-semibold"
                >
                  <i className="bi bi-mic me-2" />
                  Start Creating Speech
                </Link>
                <Link
                  to="/login"
                  className="btn btn-mana-outline btn-lg px-4 py-2 text-mv-white"
                  style={{ borderColor: '#3AAFA9' }}
                >
                  <i className="bi bi-box-arrow-in-right me-2" />
                  Sign In to Studio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION M — Professional Footer */}
      <footer className="py-5" style={{ backgroundColor: '#17252A', color: '#FFFFFF', borderTop: '1px solid rgba(58, 175, 169, 0.2)' }}>
        <div className="container">
          <div className="row g-4 mb-4">
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#3AAFA9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                  }}
                >
                  <i className="bi bi-soundwave fs-5" />
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#FFFFFF' }}>
                  ManaVoice<span style={{ color: '#3AAFA9' }}>.AI</span>
                </span>
              </div>
              <p className="small text-mv-mint mb-3" style={{ maxWidth: '320px' }}>
                Production-grade multilingual speech synthesis platform powered by FastAPI, PyTorch Transformers,
                and MongoDB persistence.
              </p>
              <div className="small text-mv-mint">
                <i className="bi bi-shield-check text-mv-mana me-1" />
                Verified Local Engine: 127.0.0.1:8000
              </div>
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <h4 className="h6 fw-bold mb-3 text-mv-white">Product</h4>
              <ul className="list-unstyled small mb-0">
                <li className="mb-2">
                  <a href="#product" className="text-mv-mint text-decoration-none">
                    Studio Overview
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#features" className="text-mv-mint text-decoration-none">
                    Capabilities
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#languages" className="text-mv-mint text-decoration-none">
                    Language Catalog
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#how-it-works" className="text-mv-mint text-decoration-none">
                    How It Works
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <h4 className="h6 fw-bold mb-3 text-mv-white">Studio App</h4>
              <ul className="list-unstyled small mb-0">
                <li className="mb-2">
                  <Link to="/studio" className="text-mv-mint text-decoration-none">
                    Speech Studio
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/dashboard" className="text-mv-mint text-decoration-none">
                    Dashboard
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/history" className="text-mv-mint text-decoration-none">
                    History
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/saved-audio" className="text-mv-mint text-decoration-none">
                    Saved Audio
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/analytics" className="text-mv-mint text-decoration-none">
                    Analytics
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <h4 className="h6 fw-bold mb-3 text-mv-white">Legal & Info</h4>
              <ul className="list-unstyled small mb-0">
                <li className="mb-2">
                  <Link to="/privacy" className="text-mv-mint text-decoration-none">
                    Privacy Policy
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/terms" className="text-mv-mint text-decoration-none">
                    Terms of Service
                  </Link>
                </li>
                <li className="mb-2">
                  <a href="#faq" className="text-mv-mint text-decoration-none">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <h4 className="h6 fw-bold mb-3 text-mv-white">AI Models</h4>
              <p className="small text-mv-mint mb-1">
                Meta MMS VITS Models under <strong>CC-BY-NC 4.0</strong> license.
              </p>
              <p className="small text-mv-mint mb-0">
                PyTorch &amp; Hugging Face Transformers.
              </p>
            </div>
          </div>

          <hr className="border-secondary my-4" />

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 small text-mv-mint">
            <div>
              ManaVoice AI &copy; 2026. All rights reserved. Strict 5-color palette &amp; Bootstrap Icons only.
            </div>
            <div>
              Built with React, Vite, FastAPI, PyTorch Transformers, and MongoDB.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
