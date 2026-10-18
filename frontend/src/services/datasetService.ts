import { apiClient } from './apiClient';

export interface DatasetItem {
  id: string;
  name: string;
  provider: string;
  verified_identifier: string;
  version: string;
  task_type: string;
  languages: string[];
  license: string;
  required_credentials?: string;
  approximate_size_mb: number;
  download_status: string;
  citation?: string;
}

export interface DatasetListResponse {
  authenticated_kaggle: boolean;
  total: number;
  datasets: DatasetItem[];
}

export const datasetService = {
  async listDatasets(): Promise<DatasetListResponse> {
    const res = await apiClient.get<DatasetListResponse>('/datasets');
    return res.data;
  },

  async searchDatasets(query: string): Promise<{ source: string; authenticated: boolean; total: number; datasets: DatasetItem[] }> {
    const res = await apiClient.get(`/datasets/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  async downloadDataset(datasetId: string, maxSizeMb: number = 500): Promise<any> {
    const res = await apiClient.post('/datasets/download', { dataset_id: datasetId, max_size_mb: maxSizeMb });
    return res.data;
  },
};

