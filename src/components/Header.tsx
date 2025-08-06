'use client';

import { useAnalysis } from '@/context/AnalysisContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function Header() {
  const router = useRouter();
  const { analysisResult, setAnalysisResult } = useAnalysis();

  const handleNewAnalysis = () => {
    setAnalysisResult(null);
    router.push('/');
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left spacer to balance the layout */}
          <div className="w-32"></div>
          
          {/* Centered title */}
          <Link href="/" className="text-xl font-bold text-gray-900">
            AlignMyResume
          </Link>
          
          {/* Right side button */}
          {analysisResult && (
            <button
              onClick={handleNewAnalysis}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              New Analysis
            </button>
          )}
        </div>
      </div>
    </header>
  );
}