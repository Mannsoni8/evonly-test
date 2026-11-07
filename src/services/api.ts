import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  AnalyzeSubmissionResponse,
  ContentSubmission,
  DetectConflictsResponse,
  ExtractRulesResponse,
  Guideline,
  GuidelineConflict,
  GuidelineRule,
  HealthResponse,
  ListSubmissionsResponse,
  ReviewDetailsResponse,
} from '../types/evolyn';

const DEFAULT_API_URL = import.meta.env.VITE_EVOLYN_API_URL || 'http://localhost:5001';
const STORAGE_KEY_API_URL = 'evolyn_api_base_url';

export function getBaseApiUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_API_URL);
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  }
  return DEFAULT_API_URL.replace(/\/+$/, '');
}

export function setBaseApiUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_API_URL, url.trim().replace(/\/+$/, ''));
  }
}

export function createApiClient(): AxiosInstance {
  const baseURL = getBaseApiUrl();
  return axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      Accept: 'application/json',
    },
  });
}

export const evolynApi = {
  /**
   * Verified Health Check Endpoint: GET /health (or fallback GET /api/health)
   */
  async checkHealth(): Promise<{ isConnected: boolean; data?: HealthResponse; error?: string }> {
    const client = createApiClient();
    try {
      // First try /health (timeout 8000ms to allow backend DB probe)
      const response = await client.get<HealthResponse>('/health', {
        timeout: 8000,
        validateStatus: (status) => status < 600, // Accept 200 and 503 degraded states
      });
      return {
        isConnected: response.status === 200 || response.status === 503,
        data: response.data,
      };
    } catch (err) {
      // Fallback try /api/health
      try {
        const fallback = await client.get<HealthResponse>('/api/health', {
          timeout: 8000,
          validateStatus: (status) => status < 600,
        });
        return {
          isConnected: fallback.status === 200 || fallback.status === 503,
          data: fallback.data,
        };
      } catch (fallbackErr) {
        const errorMsg =
          fallbackErr instanceof AxiosError
            ? fallbackErr.message + (fallbackErr.response ? ` (${fallbackErr.response.status})` : '')
            : err instanceof Error
            ? err.message
            : 'Unable to connect to Evolyn backend';
        return { isConnected: false, error: errorMsg };
      }
    }
  },

  /**
   * Verified Submissions Endpoint: POST /api/submissions
   */
  async createSubmission(input: {
    title: string;
    channel?: string;
    rawText: string;
    submittedBy?: string;
    fileUrl?: string | null;
  }): Promise<{ submission: ContentSubmission }> {
    const client = createApiClient();
    const response = await client.post<{ submission: ContentSubmission }>('/api/submissions', {
      title: input.title,
      channel: input.channel || 'WEBSITE',
      rawText: input.rawText,
      submittedBy: input.submittedBy || 'Test Client / Reviewer',
      fileUrl: input.fileUrl ?? null,
    });
    return response.data;
  },

  /**
   * Verified Synchronous Audit: POST /api/submissions/:id/analyze
   */
  async analyzeSubmission(submissionId: string): Promise<AnalyzeSubmissionResponse> {
    const client = createApiClient();
    const response = await client.post<AnalyzeSubmissionResponse>(`/api/submissions/${submissionId}/analyze`);
    return response.data;
  },

  /**
   * Verified Review Details: GET /api/submissions/:id/review
   */
  async getSubmissionReview(submissionId: string): Promise<ReviewDetailsResponse> {
    const client = createApiClient();
    const response = await client.get<ReviewDetailsResponse>(`/api/submissions/${submissionId}/review`);
    return response.data;
  },

  /**
   * Verified Submission List: GET /api/submissions
   */
  async listSubmissions(params?: { status?: string; channel?: string }): Promise<ListSubmissionsResponse> {
    const client = createApiClient();
    const response = await client.get<ListSubmissionsResponse>('/api/submissions', { params });
    return response.data;
  },

  /**
   * Verified Submission Details: GET /api/submissions/:id
   */
  async getSubmissionById(id: string): Promise<{ submission: ContentSubmission }> {
    const client = createApiClient();
    const response = await client.get<{ submission: ContentSubmission }>(`/api/submissions/${id}`);
    return response.data;
  },

  /**
   * Verified Guideline Creation: POST /api/guidelines
   */
  async createGuideline(input: {
    title: string;
    category?: string;
    version?: string;
    rawContent: string;
    s3Url?: string | null;
  }): Promise<Guideline> {
    const client = createApiClient();
    const response = await client.post<Guideline>('/api/guidelines', {
      title: input.title,
      category: input.category || 'GENERAL',
      version: input.version || '1.0',
      rawContent: input.rawContent,
      s3Url: input.s3Url ?? null,
    });
    return response.data;
  },

  /**
   * Verified Rule Extraction: POST /api/guidelines/:id/extract-rules
   */
  async extractGuidelineRules(guidelineId: string): Promise<ExtractRulesResponse> {
    const client = createApiClient();
    const response = await client.post<ExtractRulesResponse>(`/api/guidelines/${guidelineId}/extract-rules`);
    return response.data;
  },

  /**
   * Verified Rule Conflict Detection: POST /api/guidelines/:id/detect-conflicts
   */
  async detectGuidelineConflicts(guidelineId: string): Promise<DetectConflictsResponse> {
    const client = createApiClient();
    const response = await client.post<DetectConflictsResponse>(`/api/guidelines/${guidelineId}/detect-conflicts`);
    return response.data;
  },

  /**
   * Verified Guideline Details: GET /api/guidelines/:id
   */
  async getGuidelineById(
    guidelineId: string
  ): Promise<{ guideline: Guideline; rules: GuidelineRule[]; conflicts: GuidelineConflict[] }> {
    const client = createApiClient();
    const response = await client.get<{ guideline: Guideline; rules: GuidelineRule[]; conflicts: GuidelineConflict[] }>(
      `/api/guidelines/${guidelineId}`
    );
    return response.data;
  },

  /**
   * Direct Multipart / Form-Data Upload Probe
   * Sends actual binary file using multipart/form-data to test or verify backend upload handlers.
   */
  async uploadMultipart(
    file: File,
    endpoint = '/api/guidelines/upload',
    fieldName = 'file',
    onUploadProgress?: (progressPercent: number) => void
  ): Promise<{ status: number; statusText: string; data: unknown }> {
    const client = createApiClient();
    const formData = new FormData();
    formData.append(fieldName, file, file.name);

    const response = await client.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onUploadProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      },
    });

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  },
};
