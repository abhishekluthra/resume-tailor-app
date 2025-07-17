import React from 'react';
import { LoadingModalProps } from '@/types/scraping';

export function LoadingModal({ isOpen, progress = 0, currentStep, isUrlMode = false }: LoadingModalProps) {
  if (!isOpen) return null;

  // Default steps for different modes
  const defaultStep = isUrlMode ? "Preparing to scrape..." : "Analyzing resume...";
  const displayStep = currentStep || defaultStep;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          {/* Spinner */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-6"></div>
          
          {/* Main heading */}
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {isUrlMode ? 'Processing Job URL' : 'Analyzing Resume'}
          </h3>
          
          {/* Progress bar (only show if progress > 0) */}
          {progress > 0 && (
            <div className="w-full mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium text-blue-600">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Current step */}
          <p className="text-sm text-gray-600 text-center">
            {displayStep}
          </p>
          
          {/* Additional context for URL mode */}
          {isUrlMode && (
            <p className="text-xs text-gray-500 text-center mt-2">
              This may take 10-30 seconds depending on the website...
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 