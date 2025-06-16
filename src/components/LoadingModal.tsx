import React from 'react';

interface LoadingModalProps {
  isOpen: boolean;
}

export function LoadingModal({ isOpen }: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Resume</h3>
          <p className="text-sm text-gray-600 text-center">
            Please wait while we analyze your resume against the job posting...
          </p>
        </div>
      </div>
    </div>
  );
} 