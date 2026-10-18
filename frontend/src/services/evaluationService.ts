import { apiClient } from './apiClient';

export interface EvaluationReport {
  timestamp: string;
  evaluator: string;
  device: string;
  asr: {
    model: string;
    metrics: {
      wer_pct: number;
      cer_pct: number;
      samples_evaluated: number;
    };
    status: string;
  };
  translation: {
    provider: string;
    metrics: {
      bleu_score: number;
      chrf_score: number;
      samples_evaluated: number;
    };
    status: string;
  };
  tts: {
    model: string;
    metrics: {
      rtf: number;
      latency_ms: number;
      audio_duration_s: number;
    };
    status: string;
  };
  lipsync: {
    model: string;
    metrics: {
      tracking_continuity_pct: number;
      sync_confidence: number;
      frames_analyzed: number;
    };
    status: string;
  };
  system: {
    overall_health: string;
    free_disk_mb: number;
  };
}

export const evaluationService = {
  async getLatest(): Promise<EvaluationReport> {
    const res = await apiClient.get<EvaluationReport>('/evaluations/latest');
    return res.data;
  },

  async runBenchmark(): Promise<EvaluationReport> {
    const res = await apiClient.post<EvaluationReport>('/evaluations/run');
    return res.data;
  },

  async triggerTrainingSmokeTest(taskType: string = 'translation'): Promise<any> {
    const res = await apiClient.post('/training/jobs', {
      task_type: taskType,
      dataset_id: 'multilingual-parallel-translation-corpus',
      profile: 'smoke_test',
    });
    return res.data;
  },
};

