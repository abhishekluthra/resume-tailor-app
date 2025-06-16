'use client';

import React, { useState } from 'react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export function DisclaimerModal({ isOpen, onAccept }: DisclaimerModalProps) {
  const [hasScrolled, setHasScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolled(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Disclaimer
          </h2>
        </div>

        {/* Content */}
        <div
          className="px-6 py-4 overflow-y-auto max-h-96 text-sm text-gray-700 leading-relaxed"
          onScroll={handleScroll}
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Educational Purpose Only</h3>
              <p>
                This application is designed for educational and informational purposes only. It is intended to help users learn about resume optimization and job market strategies. The suggestions and recommendations provided should be considered as general guidance and educational content.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Limitations and Accuracy</h3>
              <p>
                This tool utilizes artificial intelligence to analyze resumes and job postings. AI can make mistakes, provide inaccurate information, or miss important nuances. The analysis and recommendations are generated automatically and may not always be appropriate for your specific situation, industry, or career goals.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">No Employment Guarantees</h3>
              <p>
                Using this application and following its recommendations does not guarantee employment, job interviews, or career success. Hiring decisions depend on numerous factors beyond resume optimization, including qualifications, market conditions, and employer preferences.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Professional Advice</h3>
              <p>
                This tool does not replace professional career counseling, resume writing services, or personalized career advice. For important career decisions, consider consulting with qualified career professionals, industry experts, or mentors in your field.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Data Privacy</h3>
              <p>
                Your resume and job posting data are processed temporarily for analysis purposes only. We do not store, retain, or share your personal information or documents. However, please be mindful of the sensitive information you upload and ensure you&apos;re comfortable with processing through third-party AI services.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">User Responsibility</h3>
              <p>You are responsible for:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Reviewing and verifying all suggestions before implementing them</li>
                <li>Ensuring the accuracy and truthfulness of your resume content</li>
                <li>Adapting recommendations to fit your specific circumstances</li>
                <li>Using your professional judgment when making career-related decisions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Limitation of Liability</h3>
              <p>
                By using this application, you acknowledge that the creators and operators are not liable for any consequences resulting from the use of this tool, including but not limited to employment outcomes, career decisions, or any damages arising from the use of generated recommendations.
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Remember:</strong> This tool is meant to educate and guide you. Always use your professional judgment and consider seeking additional advice for important career decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="text-xs text-gray-500">
              {!hasScrolled && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  Please scroll to read the full disclaimer
                </span>
              )}
              {hasScrolled && (
                <span className="text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Disclaimer read
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go Back
              </button>
              <button
                onClick={onAccept}
                disabled={!hasScrolled}
                className={`px-6 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  hasScrolled
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                I Understand & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 