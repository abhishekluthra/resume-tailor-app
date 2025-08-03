'use client';

import { useAnalysis } from '@/context/AnalysisContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getScoreColor } from '@/utils/colors';
import { 
  AnalysisResult, 
  InvalidJobPostingError,
  isInvalidJobPostingError 
} from '@/types/resume-analysis';
import { TabContainer } from '@/components/TabContainer';
import { JobAnalysisTab } from '@/components/JobAnalysisTab';
import { RecommendationsTab } from '@/components/RecommendationsTab';

// Component for displaying invalid job posting error
function InvalidJobPostingDisplay({ errorData }: { errorData: InvalidJobPostingError }) {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Job Posting</h1>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            {errorData.message}
          </p>
        </div>

        {/* Suggestions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            To create a valid job posting, please include:
          </h2>
          <ul className="space-y-2">
            {errorData.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-800">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Go Back and Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}

// Component for displaying valid analysis results
function AnalysisResultDisplay({ analysisResult }: { analysisResult: AnalysisResult }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Analysis Results</h1>
        
        {/* Scores Table */}
        <div className="mb-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    Overall Score
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getScoreColor(analysisResult.overallScore)}`}>
                      {analysisResult.overallScore}
                    </span>
                  </td>
                </tr>
                {Object.entries(analysisResult.categoryScores).map(([category, score]) => (
                  <tr key={category}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getScoreColor(score)}`}>
                        {score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h2>
          <p className="text-gray-600">{analysisResult.executiveSummary}</p>
        </div>

        {/* Tabbed Content */}
        <TabContainer
          tabs={[
            {
              id: 'job-analysis',
              label: 'Job Analysis',
              content: <JobAnalysisTab jobAnalysis={analysisResult.jobAnalysis} />
            },
            {
              id: 'recommendations',
              label: 'Recommendations',
              content: <RecommendationsTab recommendations={analysisResult.recommendations} />
            }
          ]}
          defaultActiveTab="job-analysis"
        />
      </div>
    </div>
  );
}

// Main component
export default function ResultsPage() {
  const router = useRouter();
  const { analysisResult } = useAnalysis();

  useEffect(() => {
    if (!analysisResult) {
      router.push('/');
    }
  }, [analysisResult, router]);

  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No analysis results found.</p>
      </div>
    );
  }

  // Check if the result is an invalid job posting error
  if (isInvalidJobPostingError(analysisResult)) {
    return <InvalidJobPostingDisplay errorData={analysisResult} />;
  }

  // Otherwise, display the normal analysis results
  return <AnalysisResultDisplay analysisResult={analysisResult} />;
}