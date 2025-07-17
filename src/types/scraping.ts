// Types related to web scraping and job posting processing

// Job input modes for the form
export type JobInputMode = 'text' | 'url';

// Scraping API response from /api/scrape
export interface ScrapeResponse {
  success: boolean;
  jobPosting: string;
  urlHash: string;
  extractedAt: string;
  fromCache: boolean;
}

// Error response from scraping API
export interface ScrapeErrorResponse {
  success: false;
  error: string;
  details?: string;
}

// Union type for all possible scrape responses
export type ScrapeApiResponse = ScrapeResponse | ScrapeErrorResponse;

// Loading state for form processing
export interface LoadingState {
  isLoading: boolean;
  progress: number;
  step: string;
  mode: JobInputMode;
}

// Props for the enhanced LoadingModal
export interface LoadingModalProps {
  isOpen: boolean;
  progress?: number;
  currentStep?: string;
  isUrlMode?: boolean;
}

// Cache-related types
export interface CachedJobPosting {
  jobPosting: string;
  extractedAt: string;
  urlHash: string;
}

export interface CacheStats {
  totalEntries: number;
  memoryUsage?: string;
}

export interface CacheStatsResponse {
  success: boolean;
  stats?: {
    totalCachedJobs: number;
    memoryUsage: string;
    timestamp: string;
  };
  error?: string;
  details?: string;
}

// Form validation types
export interface FormValidationError {
  field: 'resume' | 'jobPosting' | 'jobUrl';
  message: string;
}

// Extended form state that includes new URL functionality
export interface UploadFormState {
  file: File | null;
  jobPosting: string;
  jobUrl: string;
  jobInputMode: JobInputMode;
  isLoading: boolean;
  error: string | null;
  loadingProgress: number;
  loadingStep: string;
}

// Type guards for API responses
export function isScrapeErrorResponse(response: ScrapeApiResponse): response is ScrapeErrorResponse {
  return 'success' in response && response.success === false;
}

export function isScrapeSuccessResponse(response: ScrapeApiResponse): response is ScrapeResponse {
  return 'success' in response && response.success === true;
}