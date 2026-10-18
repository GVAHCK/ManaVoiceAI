import { apiClient } from './apiClient';


export interface TimelineSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  original_text?: string;
  translated_text?: string;
  speaker: string;
  voice_id?: string;
  confidence: number;
}

export interface LocalizationJob {
  id: string;
  user_id: string;
  job_type: 'video_localization' | 'audio_translation';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  current_stage: string;
  stage_progress_pct: number;
  source_language: string;
  target_language: string;
  source_media_storage_key: string;
  source_filename: string;
  source_duration_seconds: number;
  has_video: boolean;
  video_width?: number;
  video_height?: number;
  video_fps?: number;
  enable_lipsync: boolean;
  burn_subtitles: boolean;
  speech_volume: number;
  background_volume: number;
  speaking_rate: number;
  segments: TimelineSegment[];
  lipsync_applied: boolean;
  lipsync_status?: string;
  lipsync_confidence?: number;
  faces_detected_count: number;
  output_video_storage_key?: string;
  output_audio_storage_key?: string;
  output_srt_storage_key?: string;
  output_vtt_storage_key?: string;
  processing_logs: string[];
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface MediaProbeResult {
  storage_key: string;
  filename: string;
  size_bytes: number;
  probe: {
    duration: number;
    has_video: boolean;
    has_audio: boolean;
    format_name: string;
    video?: {
      codec: string;
      width: number;
      height: number;
      fps: number;
      duration: number;
    };
    audio?: {
      codec: string;
      sample_rate: number;
      channels: number;
      duration: number;
    };
  };
}

export const localizationService = {
  async uploadMedia(file: File): Promise<MediaProbeResult> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<MediaProbeResult>('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async createJob(payload: {
    source_media_storage_key: string;
    source_filename: string;
    source_language: string;
    target_language: string;
    job_type: string;
    enable_lipsync: boolean;
    burn_subtitles: boolean;
    speech_volume: number;
    background_volume: number;
    speaking_rate: number;
  }): Promise<LocalizationJob> {
    const formData = new FormData();
    formData.append('source_media_storage_key', payload.source_media_storage_key);
    formData.append('source_filename', payload.source_filename);
    formData.append('source_language', payload.source_language);
    formData.append('target_language', payload.target_language);
    formData.append('job_type', payload.job_type);
    formData.append('enable_lipsync', String(payload.enable_lipsync));
    formData.append('burn_subtitles', String(payload.burn_subtitles));
    formData.append('speech_volume', String(payload.speech_volume));
    formData.append('background_volume', String(payload.background_volume));
    formData.append('speaking_rate', String(payload.speaking_rate));

    const res = await apiClient.post<LocalizationJob>('/localization/jobs', formData);
    return res.data;
  },

  async listJobs(page: number = 1, pageSize: number = 10): Promise<{ items: LocalizationJob[]; total: number }> {
    const res = await apiClient.get<{ items: LocalizationJob[]; total: number }>(`/localization/jobs?page=${page}&page_size=${pageSize}`);
    return res.data;
  },

  async getJob(jobId: string): Promise<LocalizationJob> {
    const res = await apiClient.get<LocalizationJob>(`/localization/jobs/${jobId}`);
    return res.data;
  },

  async updateSegment(jobId: string, segmentId: number, data: { original_text?: string; translated_text?: string; speaker?: string }): Promise<LocalizationJob> {
    const params = new URLSearchParams();
    if (data.original_text !== undefined) params.append('original_text', data.original_text);
    if (data.translated_text !== undefined) params.append('translated_text', data.translated_text);
    if (data.speaker !== undefined) params.append('speaker', data.speaker);

    const res = await apiClient.patch<LocalizationJob>(`/localization/jobs/${jobId}/segments/${segmentId}?${params.toString()}`);
    return res.data;
  },

  async deleteJob(jobId: string): Promise<void> {
    await apiClient.delete(`/localization/jobs/${jobId}`);
  },

  getArtifactDownloadUrl(jobId: string, artifactType: 'video' | 'audio' | 'srt' | 'vtt'): string {
    const baseUrl = apiClient.defaults.baseURL || '/api/v1';
    return `${baseUrl}/localization/jobs/${jobId}/artifacts/${artifactType}`;
  },

};
