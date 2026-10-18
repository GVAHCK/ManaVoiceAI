import React, { useState, useEffect } from 'react';
import { evaluationService } from '../services/evaluationService';
import type { EvaluationReport } from '../services/evaluationService';


export const EvaluationsPage: React.FC = () => {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningBenchmark, setRunningBenchmark] = useState(false);
  const [runningTraining, setRunningTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchLatestReport();
  }, []);

  const fetchLatestReport = async () => {
    try {
      setLoading(true);
      const data = await evaluationService.getLatest();
      setReport(data);
    } catch (e) {
      setNotification({ message: 'Failed to fetch evaluation report', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunBenchmark = async () => {
    try {
      setRunningBenchmark(true);
      setNotification({ message: 'Executing empirical evaluation benchmark across all models...', type: 'success' });
      const updated = await evaluationService.runBenchmark();
      setReport(updated);
      setNotification({ message: 'Benchmark completed. Real metrics recorded.', type: 'success' });
    } catch (e: any) {
      setNotification({ message: 'Evaluation benchmark failed', type: 'error' });
    } finally {
      setRunningBenchmark(false);
    }
  };

  const handleRunTraining = async () => {
    try {
      setRunningTraining(true);
      setNotification({ message: 'Executing PyTorch LoRA fine-tuning smoke test...', type: 'success' });
      const res = await evaluationService.triggerTrainingSmokeTest('translation');
      setTrainingResult(res);
      setNotification({ message: `Training run '${res.run_id}' completed in ${res.duration_seconds}s! Best val loss: ${res.best_val_loss}`, type: 'success' });
    } catch (e: any) {
      setNotification({ message: e?.response?.data?.detail || 'Training job failed', type: 'error' });
    } finally {
      setRunningTraining(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#DEF2F1', minHeight: '100vh', color: '#17252A' }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(43, 122, 120, 0.3)' }}>
        <div>
          <h2 style={{ color: '#17252A', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Empirical Model Evaluation & Benchmark Dashboard
          </h2>
          <p style={{ color: '#2B7A78', margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>
            Verifiable quantitative evaluation metrics across ASR, Translation, Speech Synthesis, and Lip-Sync.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn d-flex align-items-center gap-2"
            style={{ backgroundColor: '#2B7A78', color: '#FFFFFF', borderRadius: '8px', fontWeight: 600 }}
            disabled={runningBenchmark}
            onClick={handleRunBenchmark}
          >
            {runningBenchmark ? (
              <span className="spinner-border spinner-border-sm" role="status" />
            ) : (
              <i className="bi bi-speedometer2" />
            )}
            <span>Run Benchmark Evaluation</span>
          </button>

          <button
            className="btn d-flex align-items-center gap-2"
            style={{ backgroundColor: '#3AAFA9', color: '#FFFFFF', borderRadius: '8px', fontWeight: 600 }}
            disabled={runningTraining}
            onClick={handleRunTraining}
          >
            {runningTraining ? (
              <span className="spinner-border spinner-border-sm" role="status" />
            ) : (
              <i className="bi bi-cpu-fill" />
            )}
            <span>Run LoRA Training Smoke Test</span>
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
          <span>{notification.message}</span>
          <button className="btn btn-sm border-0" onClick={() => setNotification(null)} style={{ color: 'inherit' }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {/* Metrics Cards Grid */}
      {loading || !report ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: '#3AAFA9' }} role="status" />
          <div className="mt-2" style={{ color: '#2B7A78', fontWeight: 500 }}>Loading evaluation metrics...</div>
        </div>
      ) : (
        <div className="row g-4 mb-4">
          {/* ASR Card */}
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card shadow-sm border-0 p-4 h-100" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2B7A78', textTransform: 'uppercase' }}>
                  Speech Recognition (ASR)
                </span>
                <i className="bi bi-soundwave fs-4" style={{ color: '#3AAFA9' }} />
              </div>
              <div className="display-6 fw-bold" style={{ color: '#17252A' }}>
                {report.asr.metrics.wer_pct}%
              </div>
              <div style={{ fontSize: '0.8rem', color: '#2B7A78', marginBottom: '1rem' }}>
                Word Error Rate (WER) • CER: {report.asr.metrics.cer_pct}%
              </div>
              <div className="p-2 rounded mt-auto" style={{ backgroundColor: '#DEF2F1', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                Model: {report.asr.model}
              </div>
            </div>
          </div>

          {/* Translation Card */}
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card shadow-sm border-0 p-4 h-100" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2B7A78', textTransform: 'uppercase' }}>
                  Translation (sacreBLEU)
                </span>
                <i className="bi bi-translate fs-4" style={{ color: '#3AAFA9' }} />
              </div>
              <div className="display-6 fw-bold" style={{ color: '#17252A' }}>
                {report.translation.metrics.bleu_score}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#2B7A78', marginBottom: '1rem' }}>
                Corpus BLEU Score • chrF: {report.translation.metrics.chrf_score}
              </div>
              <div className="p-2 rounded mt-auto" style={{ backgroundColor: '#DEF2F1', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                Provider: {report.translation.provider}
              </div>
            </div>
          </div>

          {/* TTS Card */}
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card shadow-sm border-0 p-4 h-100" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2B7A78', textTransform: 'uppercase' }}>
                  Speech Synthesis (TTS)
                </span>
                <i className="bi bi-mic fs-4" style={{ color: '#3AAFA9' }} />
              </div>
              <div className="display-6 fw-bold" style={{ color: '#17252A' }}>
                {report.tts.metrics.rtf}x
              </div>
              <div style={{ fontSize: '0.8rem', color: '#2B7A78', marginBottom: '1rem' }}>
                Real-Time Factor (RTF) • Latency: {report.tts.metrics.latency_ms}ms
              </div>
              <div className="p-2 rounded mt-auto" style={{ backgroundColor: '#DEF2F1', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                Engine: {report.tts.model}
              </div>
            </div>
          </div>

          {/* Lip-Sync Card */}
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card shadow-sm border-0 p-4 h-100" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2B7A78', textTransform: 'uppercase' }}>
                  Lip-Sync & Tracking
                </span>
                <i className="bi bi-camera-video fs-4" style={{ color: '#3AAFA9' }} />
              </div>
              <div className="display-6 fw-bold" style={{ color: '#17252A' }}>
                {report.lipsync.metrics.tracking_continuity_pct}%
              </div>
              <div style={{ fontSize: '0.8rem', color: '#2B7A78', marginBottom: '1rem' }}>
                Face Tracking Continuity • Sync: {report.lipsync.metrics.sync_confidence}
              </div>
              <div className="p-2 rounded mt-auto" style={{ backgroundColor: '#DEF2F1', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                Adapter: {report.lipsync.model}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Training Result Box (If training run was executed) */}
      {trainingResult && (
        <div className="card shadow-sm border-0 p-4 mb-4" style={{ backgroundColor: '#17252A', borderRadius: '12px', color: '#DEF2F1' }}>
          <h5 style={{ color: '#3AAFA9', fontWeight: 700, marginBottom: '1rem' }}>
            <i className="bi bi-check2-circle me-2" />
            Active Checkpoint Fine-Tuning Execution Record
          </h5>
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div><strong>Run ID:</strong> {trainingResult.run_id}</div>
              <div><strong>Task Type:</strong> {trainingResult.task_type}</div>
              <div><strong>Profile:</strong> {trainingResult.profile}</div>
            </div>
            <div className="col-12 col-md-4">
              <div><strong>Epochs Completed:</strong> {trainingResult.epochs}</div>
              <div><strong>Duration:</strong> {trainingResult.duration_seconds}s</div>
              <div><strong>Device:</strong> {trainingResult.device}</div>
            </div>
            <div className="col-12 col-md-4">
              <div><strong>Best Val Loss:</strong> {trainingResult.best_val_loss}</div>
              <div style={{ wordBreak: 'break-all', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                <strong>Checkpoint:</strong> {trainingResult.checkpoint_path}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
