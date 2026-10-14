export interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
  default_source_language: string;
  default_target_language: string;
  default_model_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface Language {
  code: string;
  name: string;
  native_name: string;
  tts_supported: boolean;
  tts_model_id?: string;
  model_readiness: 'ready' | 'downloadable' | 'unavailable';
  translation_supported: boolean;
  voices: string[];
  notes: string;
}

export interface Generation {
  id: string;
  user_id: string;
  original_text: string;
  translated_text?: string;
  source_language: string;
  target_language: string;
  translation_provider?: string;
  tts_provider: string;
  model_id: string;
  voice_id?: string;
  status: 'pending' | 'completed' | 'failed';
  error_code?: string;
  error_message_safe?: string;
  audio_url?: string;
  audio_format: string;
  sample_rate: number;
  duration_seconds: number;
  file_size_bytes: number;
  character_count: number;
  created_at: string;
  completed_at?: string;
  is_saved?: boolean;
}

export interface HistoryResponse {
  items: Generation[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MetricCardData {
  value: number;
  formatted: string;
  change_pct?: number;
  subtext: string;
}

export interface DashboardSummary {
  total_generations: MetricCardData;
  successful_generations: MetricCardData;
  total_audio_duration_seconds: MetricCardData;
  characters_processed: MetricCardData;
  languages_used: MetricCardData;
  success_rate_pct: MetricCardData;
}

export interface ActivityDataPoint {
  date: string;
  count: number;
  success_count: number;
  duration_seconds: number;
}

export interface LanguageDistributionPoint {
  language: string;
  name: string;
  count: number;
  percentage: number;
}

export interface StatusDistributionPoint {
  status: string;
  count: number;
  color: string;
}

export interface MonthlyUsage {
  generations_this_month: number;
  characters_this_month: number;
  audio_seconds_this_month: number;
}

export interface AnalyticsOverview {
  total_volume: number;
  total_duration_hours: number;
  total_characters: number;
  average_duration_seconds: number;
  overall_success_rate: number;
  active_languages_count: number;
  daily_trends: Array<{
    date: string;
    total_generations: number;
    completed_generations: number;
    failed_generations: number;
    characters_processed: number;
    duration_seconds: number;
  }>;
  language_usage: Array<{
    language_code: string;
    language_name: string;
    count: number;
    total_duration: number;
    percentage: number;
  }>;
  model_usage: Array<{
    model_id: string;
    count: number;
    status: string;
  }>;
}
