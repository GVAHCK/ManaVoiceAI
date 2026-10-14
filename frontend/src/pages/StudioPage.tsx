import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { speechService } from '../services/speechService';
import { languagesService } from '../services/languagesService';
import { AudioPlayer } from '../components/speech/AudioPlayer';
import type { Language, Generation } from '../types';

export const StudioPage: React.FC = () => {
  const { user } = useAuth();

  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('en');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProvider, setTranslationProvider] = useState<string | null>(null);

  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('Standard');
  const [speakingRate, setSpeakingRate] = useState(1.0);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [latestGeneration, setLatestGeneration] = useState<Generation | null>(null);

  // Load languages catalog on mount
  useEffect(() => {
    const fetchLangs = async () => {
      try {
        const langs = await languagesService.getLanguages();
        setAvailableLanguages(langs);
      } catch (e) {
        console.error('Failed to load languages catalog:', e);
      }
    };
    fetchLangs();

    if (user?.default_source_language) {
      setSourceLang(user.default_source_language);
    }
    if (user?.default_target_language) {
      setTargetLang(user.default_target_language);
    }
  }, [user]);

  const handleSwapLanguages = () => {
    const oldSource = sourceLang;
    const oldTarget = targetLang;
    setSourceLang(oldTarget);
    setTargetLang(oldSource);
    // If translated text existed, swap it to input
    if (translatedText) {
      setInputText(translatedText);
      setTranslatedText(inputText);
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      alert('Please enter text to translate.');
      return;
    }
    setIsTranslating(true);
    setGenerationError(null);
    try {
      const res = await speechService.translate({
        text: inputText,
        source_language: sourceLang,
        target_language: targetLang,
      });
      setTranslatedText(res.translated_text);
      setTranslationProvider(res.provider);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Translation failed.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGenerateSpeech = async () => {
    const textToSynthesize = (translatedText || inputText).trim();
    if (!textToSynthesize) {
      setGenerationError('Please enter text to generate speech.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await speechService.generate({
        original_text: inputText,
        translated_text: translatedText && sourceLang !== targetLang ? translatedText : undefined,
        source_language: sourceLang,
        target_language: targetLang,
        voice_id: selectedVoice,
        speaking_rate: speakingRate,
      });
      setLatestGeneration(result);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Speech generation failed. Please try again.';
      setGenerationError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentLangInfo = availableLanguages.find((l) => l.code === targetLang);

  return (
    <div className="container-fluid p-0">
      <div className="row g-4">
        {/* Left Column: Input, Translation & Controls */}
        <div className="col-lg-8">
          <div className="card-mana p-4 mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 className="h5 fw-bold text-mv-midnight mb-0">Speech Studio</h2>
              <span className="badge" style={{ backgroundColor: '#DEF2F1', color: '#17252A', border: '1px solid #3AAFA9' }}>
                <i className="bi bi-cpu me-1" />
                Meta MMS/VITS Engine
              </span>
            </div>

            {/* Language Controls Bar */}
            <div className="row g-2 align-items-center mb-3 p-3 rounded" style={{ backgroundColor: '#DEF2F1' }}>
              <div className="col-sm-5">
                <label className="small text-mv-deep-teal fw-semibold mb-1">Source Language</label>
                <select
                  className="form-select form-control-mana"
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                >
                  {availableLanguages.map((l) => (
                    <option key={`src-${l.code}`} value={l.code}>
                      {l.name} ({l.native_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-sm-2 text-center pt-sm-4">
                <button
                  type="button"
                  className="btn btn-sm btn-mana-outline"
                  title="Swap source and target languages"
                  onClick={handleSwapLanguages}
                >
                  <i className="bi bi-arrow-left-right" />
                </button>
              </div>

              <div className="col-sm-5">
                <label className="small text-mv-deep-teal fw-semibold mb-1">Target Speech Language</label>
                <select
                  className="form-select form-control-mana"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                >
                  {availableLanguages.map((l) => (
                    <option key={`tgt-${l.code}`} value={l.code}>
                      {l.name} ({l.native_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Original Text Input Area */}
            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="small text-mv-midnight fw-semibold" htmlFor="input-text">
                  Original Text
                </label>
                <span className="small text-mv-deep-teal">{inputText.length} / 3000 chars</span>
              </div>
              <textarea
                id="input-text"
                className="form-control form-control-mana"
                rows={4}
                maxLength={3000}
                placeholder="Type or paste the text you want to synthesize into speech..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>

            {/* Translation Action (when source != target) */}
            {sourceLang !== targetLang && (
              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-mana-secondary d-flex align-items-center gap-1"
                      onClick={handleTranslate}
                      disabled={isTranslating || !inputText.trim()}
                    >
                      {isTranslating ? (
                        <>
                          <div className="spinner-border spinner-border-sm text-mv-white" role="status" />
                          <span>Translating...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-translate" />
                          <span>Translate Text</span>
                        </>
                      )}
                    </button>
                    {translationProvider && (
                      <span className="small text-mv-deep-teal">
                        Provider: <strong>{translationProvider}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Editable Translated Text Preview */}
                <div className="mb-1">
                  <label className="small text-mv-deep-teal fw-semibold">
                    Translated Text ({targetLang.toUpperCase()}) &bull; Review & Edit:
                  </label>
                  <textarea
                    className="form-control form-control-mana"
                    rows={3}
                    placeholder="Translated text will appear here. You can edit it before generating speech."
                    value={translatedText}
                    onChange={(e) => setTranslatedText(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Voice & Synthesis Settings */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="small text-mv-deep-teal fw-semibold mb-1">Voice Profile</label>
                <select
                  className="form-select form-control-mana"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                >
                  {currentLangInfo?.voices.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  )) || <option value="Standard">Standard Voice</option>}
                </select>
                <span className="small text-mv-deep-teal" style={{ fontSize: '0.72rem' }}>
                  Model: {currentLangInfo?.tts_model_id || 'facebook/mms-tts-eng'}
                </span>
              </div>

              <div className="col-md-6">
                <label className="small text-mv-deep-teal fw-semibold mb-1">
                  Speaking Rate: {speakingRate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  className="form-range mt-2"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={speakingRate}
                  onChange={(e) => setSpeakingRate(parseFloat(e.target.value))}
                  style={{ accentColor: '#3AAFA9' }}
                />
              </div>
            </div>

            {/* Error Notification */}
            {generationError && (
              <div
                className="p-3 mb-3 rounded d-flex align-items-center gap-2"
                style={{ backgroundColor: 'rgba(23, 37, 42, 0.1)', border: '1px solid #17252A', color: '#17252A' }}
                role="alert"
              >
                <i className="bi bi-exclamation-circle text-mv-deep-teal fs-5" />
                <span className="small">{generationError}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              type="button"
              className="btn btn-mana w-100 py-3 fs-5 d-flex align-items-center justify-content-center gap-2"
              onClick={handleGenerateSpeech}
              disabled={isGenerating || (!inputText.trim() && !translatedText.trim())}
            >
              {isGenerating ? (
                <>
                  <div className="spinner-border spinner-border-sm text-mv-white" role="status" />
                  <span>Synthesizing Speech with Transformers...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-lightning-charge-fill" />
                  <span>Generate Speech</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Audio Player Section */}
          {latestGeneration && latestGeneration.audio_url && (
            <div className="card-mana p-4 mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h3 className="h6 mb-0 fw-bold text-mv-midnight">Generated Speech Audio</h3>
                <span className="badge-mana-completed">
                  <i className="bi bi-check-circle me-1" />
                  Synthesis Ready
                </span>
              </div>

              <AudioPlayer
                audioUrl={latestGeneration.audio_url}
                duration={latestGeneration.duration_seconds}
                fileName={`manavoice_${latestGeneration.id}.wav`}
              />

              <div className="row g-2 mt-3 pt-3 border-top border-mv-subtle small text-mv-deep-teal">
                <div className="col-sm-4">
                  <strong>Duration:</strong> {latestGeneration.duration_seconds.toFixed(2)} seconds
                </div>
                <div className="col-sm-4">
                  <strong>Format:</strong> {latestGeneration.audio_format.toUpperCase()} (
                  {latestGeneration.sample_rate} Hz)
                </div>
                <div className="col-sm-4">
                  <strong>File Size:</strong> {(latestGeneration.file_size_bytes / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Model Specs & Guidance */}
        <div className="col-lg-4">
          <div className="card-mana p-3 mb-4">
            <h3 className="h6 fw-bold text-mv-midnight mb-2">Model Specifications</h3>
            <div className="small text-mv-deep-teal mb-3">
              Active Neural Checkpoint for <strong>{currentLangInfo?.name || 'Selected Language'}</strong>
            </div>

            <div className="list-group list-group-flush small">
              <div className="list-group-item px-0 d-flex justify-content-between">
                <span className="text-mv-deep-teal">Model Checkpoint:</span>
                <span className="font-monospace text-mv-midnight">
                  {currentLangInfo?.tts_model_id || 'facebook/mms-tts-eng'}
                </span>
              </div>
              <div className="list-group-item px-0 d-flex justify-content-between">
                <span className="text-mv-deep-teal">Architecture:</span>
                <span className="text-mv-midnight fw-semibold">VITS / MMS</span>
              </div>
              <div className="list-group-item px-0 d-flex justify-content-between">
                <span className="text-mv-deep-teal">License:</span>
                <span className="text-mv-midnight">CC-BY-NC 4.0</span>
              </div>
              <div className="list-group-item px-0 d-flex justify-content-between">
                <span className="text-mv-deep-teal">Sample Rate:</span>
                <span className="text-mv-midnight">16,000 Hz</span>
              </div>
              <div className="list-group-item px-0 d-flex justify-content-between">
                <span className="text-mv-deep-teal">Readiness:</span>
                <span className="badge bg-mv-teal text-mv-white">
                  {currentLangInfo?.model_readiness || 'ready'}
                </span>
              </div>
            </div>
          </div>

          <div className="card-mana p-3" style={{ backgroundColor: '#DEF2F1' }}>
            <h3 className="h6 fw-bold text-mv-midnight mb-2">
              <i className="bi bi-info-circle me-1 text-mv-deep-teal" />
              Studio Tips
            </h3>
            <ul className="small text-mv-deep-teal ps-3 mb-0">
              <li className="mb-1">
                When source and target languages differ, use <strong>Translate Text</strong> to review the
                translated script before synthesis.
              </li>
              <li className="mb-1">
                You can directly edit the translated text in the preview box to customize vocabulary or
                pronunciation.
              </li>
              <li>
                All audio files are saved in high-fidelity 16kHz uncompressed WAV format ready for immediate
                playback and download.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
