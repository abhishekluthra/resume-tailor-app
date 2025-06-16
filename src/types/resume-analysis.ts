export interface CategoryScores {
  skillsMatch: string;
  experienceLevel: string;
  keywordOptimization: string;
  qualificationsAlignment: string;
}

export interface JobAnalysis {
  requiredSkills: string[];
  keyExperiences: string[];
  primaryResponsibilities: string[];
}

export interface Recommendation {
  id: number;
  title: string;
  description: string;
  impact: string;
  category: string;
}

export interface AnalysisResult {
  overallScore: string;
  categoryScores: CategoryScores;
  executiveSummary: string;
  jobAnalysis: JobAnalysis;
  recommendations: Recommendation[];
}

export interface InvalidJobPostingError {
  error: "invalid_job_posting";
  message: string;
  suggestions: string[];
}

export type AnalysisResponse = AnalysisResult | InvalidJobPostingError;

export function isInvalidJobPostingError(response: AnalysisResponse): response is InvalidJobPostingError {
  return 'error' in response && response.error === 'invalid_job_posting';
} 