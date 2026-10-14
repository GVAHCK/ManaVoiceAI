import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#DEF2F1', color: '#17252A' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg px-4 py-3" style={{ backgroundColor: '#17252A' }}>
        <div className="container d-flex align-items-center justify-content-between">
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <div
              style={{
                width: '36px',
                height: '36px',
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
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
              ManaVoice<span style={{ color: '#3AAFA9' }}>.AI</span>
            </span>
          </Link>
          <Link to="/" className="btn btn-sm btn-mana-outline text-mv-white" style={{ borderColor: '#3AAFA9' }}>
            <i className="bi bi-arrow-left me-1" /> Back to Home
          </Link>
        </div>
      </nav>

      <div className="container py-5" style={{ maxWidth: '840px' }}>
        <div className="card-mana p-4 p-md-5 mb-4">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="badge" style={{ backgroundColor: '#DEF2F1', color: '#17252A', border: '1px solid #3AAFA9' }}>
              Legal Documentation
            </span>
            <span className="text-mv-deep-teal small">Last Updated: October 2026</span>
          </div>
          <h1 className="h3 fw-bold text-mv-midnight mb-3">Privacy Policy</h1>
          <p className="text-mv-deep-teal small mb-4">
            This Privacy Policy explains how ManaVoice AI collects, stores, processes, and protects your personal
            information, speech generation requests, and audio recordings.
          </p>

          <hr className="border-mv-subtle my-4" />

          <section className="mb-4">
            <h2 className="h6 fw-bold text-mv-midnight mb-2">1. Information We Collect</h2>
            <p className="small text-mv-midnight mb-2">
              ManaVoice AI collects the following categories of information to provide the text-to-speech platform:
            </p>
            <ul className="small text-mv-deep-teal ps-3 mb-0">
              <li><strong>Account Credentials:</strong> Email address and hashed passwords (using industry-standard bcrypt encryption).</li>
              <li><strong>Profile Information:</strong> Display name and language preferences (source and target defaults).</li>
              <li><strong>Generation Requests:</strong> Original input text, translated text previews, model identifiers, voice parameters, and character counts.</li>
              <li><strong>Audio Metadata:</strong> Generated waveform duration, sample rate (16kHz), storage keys, and completion timestamps.</li>
            </ul>
          </section>

          <section className="mb-4">
            <h2 className="h6 fw-bold text-mv-midnight mb-2">2. How Audio and Data are Stored</h2>
            <p className="small text-mv-midnight mb-0">
              All user generation records and account preferences are securely stored in MongoDB with strict user-level
              ownership scoping. Audio binaries are stored on isolated, encrypted storage adapters and are served only
              through authenticated, authorized endpoints. We do not store audio files inside MongoDB directly.
            </p>
          </section>

          <section className="mb-4">
            <h2 className="h6 fw-bold text-mv-midnight mb-2">3. User Data Isolation & Security</h2>
            <p className="small text-mv-midnight mb-0">
              Every request to generate, retrieve, play, download, or delete speech is validated against your authenticated
              user ID. No user has permission or technical capability to view, access, or delete another user's audio or
              history records.
            </p>
          </section>

          <section className="mb-4">
            <h2 className="h6 fw-bold text-mv-midnight mb-2">4. Audio Deletion & Retention</h2>
            <p className="small text-mv-midnight mb-0">
              You maintain full control over your content. Deleting a generation record from the Generation History or
              Saved Audio library triggers immediate removal of the metadata record in MongoDB and permanent deletion
              of the associated WAV file from storage. When an account is deleted, all historical generations and audio
              files are purged permanently.
            </p>
          </section>

          <section className="mb-4">
            <h2 className="h6 fw-bold text-mv-midnight mb-2">5. Third-Party Services & AI Models</h2>
            <p className="small text-mv-midnight mb-0">
              Speech synthesis inference is executed locally or on dedicated hosted workers using Meta MMS VITS models.
              Input text is processed strictly for the purpose of audio generation and is not used to train public models.
            </p>
          </section>

          <div className="p-3 rounded small" style={{ backgroundColor: '#DEF2F1', border: '1px solid #3AAFA9' }}>
            <i className="bi bi-shield-check me-2 text-mv-deep-teal" />
            <strong>Compliance Note:</strong> This document serves as a standardized privacy disclosure template for the
            ManaVoice AI platform. Specific enterprise deployments should review data retention schedules to ensure alignment
            with organizational compliance requirements.
          </div>
        </div>
      </div>
    </div>
  );
};
