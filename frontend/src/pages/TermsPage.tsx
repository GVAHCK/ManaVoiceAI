import React from 'react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
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
              Terms of Service
            </span>
            <span className="text-mv-deep-teal small">Last Updated: October 2026</span>
          </div>
          <h1 className="h3 fw-bold text-mv-midnight mb-3">Terms of Service</h1>
          <p className="text-mv-deep-teal small mb-4">
            Please read these Terms of Service carefully before utilizing the ManaVoice AI multilingual speech platform.
            By registering an account or generating speech, you agree to these terms.
          </p>

          <hr className="border-mv-subtle my-4" />

          <section className="mb-4">
            <h2 className="h6 fw-bold text-mv-midnight mb-2">1. Description of Service</h2>
            <p className="small text-mv-midnight mb-0">
              ManaVoice AI provides an AI-driven multilingual text-to-speech studio, translation integration,
              persistent audio storage, historical generation logs, and personalized speech settings.
              The service is provided for individual, research, and organizational productivity workflows.
            </p>
          </section>

          <section className="mb-4">
            <h2 className="h6 fw-bold text-mv-midnight mb-2">2. AI Models and Licensing Attribution</h2>
            <p className="small text-mv-midnight mb-2">
              ManaVoice AI employs open-source deep learning speech synthesis checkpoints, primarily from the
              Meta Massively Multilingual Speech (MMS) family released under the <strong>CC-BY-NC 4.0</strong> license
              (Creative Commons Attribution-NonCommercial 4.0 International).
            </p>
            <ul className="small text-mv-deep-teal ps-3 mb-0">
              <li><strong>Non-Commercial Notice:</strong> In accordance with the Meta MMS license terms, default checkpoint models are designated for research, evaluation, and personal non-commercial use.</li>
              <li><strong>Enterprise Deployment:</strong> Commercial production deployments require pairing with commercial-tier TTS models (e.g., custom fine-tuned checkpoints or certified commercial inference providers).</li>
              <li><strong>Model Attribution:</strong> Meta AI MMS VITS models; Hugging Face Transformers pipeline.</li>
            </ul>
          </section>

          <section className="mb-4">
            <h2 className="h6 fw-bold text-mv-midnight mb-2">3. Acceptable Use Policy</h2>
            <p className="small text-mv-midnight mb-2">
              Users agree not to utilize ManaVoice AI for any unlawful or abusive activities, including:
            </p>
            <ul className="small text-mv-deep-teal ps-3 mb-0">
              <li>Synthesizing fraudulent voices, impersonation without authorization, or generating deceptive disinformation.</li>
              <li>Attempting to bypass API rate limits, access controls, or user authentication mechanisms.</li>
              <li>Injecting malicious inputs designed to compromise server infrastructure, model runtimes, or database stability.</li>
              <li>Attempting to access generation records, audio keys, or dashboard metrics belonging to other user accounts.</li>
            </ul>
          </section>

          <section className="mb-4">
            <h2 className="h6 fw-bold text-mv-midnight mb-2">4. User Account & Data Responsibility</h2>
            <p className="small text-mv-midnight mb-0">
              You are responsible for maintaining the confidentiality of your login credentials. You are solely
              responsible for the text submitted for translation and audio synthesis. ManaVoice AI provides data
              isolation between users; however, users are advised to maintain personal backups of critical audio assets.
            </p>
          </section>

          <section className="mb-4">
            <h2 className="h6 fw-bold text-mv-midnight mb-2">5. Data Retention & Permanent Deletion</h2>
            <p className="small text-mv-midnight mb-0">
              When a user deletes a generation record or deletes their account via the Settings interface, all corresponding
              database metadata in MongoDB and the generated audio files in storage are permanently purged. Purged data
              cannot be recovered.
            </p>
          </section>

          <section className="mb-4">
            <h2 className="h6 fw-bold text-mv-midnight mb-2">6. Limitation of Liability</h2>
            <p className="small text-mv-midnight mb-0">
              ManaVoice AI is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind.
              In no event shall ManaVoice AI or its developers be liable for indirect, incidental, special, or consequential
              damages resulting from the use or inability to use the speech synthesis services.
            </p>
          </section>

          <div className="p-3 rounded small" style={{ backgroundColor: '#DEF2F1', border: '1px solid #3AAFA9' }}>
            <i className="bi bi-file-earmark-lock me-2 text-mv-deep-teal" />
            <strong>Legal Notice:</strong> This document represents a standard terms template for the ManaVoice AI platform.
            Production business operations should ensure alignment with appropriate legal counsel and regulatory standards.
          </div>
        </div>
      </div>
    </div>
  );
};
