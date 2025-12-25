'use client';

import { useState, useEffect } from 'react';
import { JobAnalysis } from '@/types/resume-analysis';
import { endpoints } from '@/config/endpoints';

interface AIInsight {
  category: 'market' | 'position' | 'strategic';
  title: string;
  content: string;
  icon: string;
}

interface AIInsightsData {
  insights: AIInsight[];
  generatedAt: string;
}

interface AIInsightsProps {
  jobAnalysis: JobAnalysis;
}

export function AIInsights({ jobAnalysis }: AIInsightsProps) {
  const [insights, setInsights] = useState<AIInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateInsights = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(endpoints.insights, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobAnalysis }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate insights');
        }

        const result = await response.json();
        setInsights(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    generateInsights();
  }, [jobAnalysis]);

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
          <h3 className="text-lg font-medium text-blue-900">Generating AI Insights...</h3>
        </div>
        <p className="text-blue-700 text-sm mt-2">
          Analyzing job requirements to provide strategic insights
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-900 mb-2">Unable to Generate Insights</h3>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'market': return 'bg-green-50 border-green-200 text-green-800';
      case 'position': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'strategic': return 'bg-orange-50 border-orange-200 text-orange-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-blue-100 rounded-lg mr-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-blue-900">AI Insights</h3>
      </div>

      <div className="space-y-4">
        {insights.insights.map((insight, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getCategoryColor(insight.category)}`}
          >
            <div className="flex items-start">
              <span className="text-2xl mr-3" role="img" aria-label={insight.category}>
                {insight.icon}
              </span>
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                <p className="text-sm opacity-90">{insight.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-blue-600 mt-4 opacity-75">
        Insights generated on {new Date(insights.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}