import { AnalysisResponse } from './resume-analysis';

export interface AnalysisContextType {
  analysisResult: AnalysisResponse | null;
  setAnalysisResult: (result: AnalysisResponse | null) => void;
}

export interface DisclaimerContextType {
  hasAcceptedDisclaimer: boolean;
  setHasAcceptedDisclaimer: (value: boolean) => void;
} 