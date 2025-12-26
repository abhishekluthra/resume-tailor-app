'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { LoadingModal } from './LoadingModal';
import { useRouter } from 'next/navigation';
import { useAnalysis } from '@/context/AnalysisContext';
import { endpoints } from '@/config/endpoints';
import {
  JobInputMode,
  ScrapeApiResponse,
  isScrapeSuccessResponse,
  isScrapeErrorResponse
} from '@/types/scraping';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

export function UploadForm() {
  const router = useRouter();
  const { setAnalysisResult } = useAnalysis();
  const [file, setFile] = useState<File | null>(null);
  const [jobPosting, setJobPosting] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobInputMode, setJobInputMode] = useState<JobInputMode>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError(`File size exceeds 2MB limit. Please upload a smaller file.`);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!file) {
      setError('Please upload a resume');
      return;
    }
    
    if (jobInputMode === 'text' && !jobPosting.trim()) {
      setError('Please provide a job posting');
      return;
    }
    
    if (jobInputMode === 'url' && !jobUrl.trim()) {
      setError('Please provide a job posting URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);
    setLoadingStep('');

    try {
      let finalJobPosting = jobPosting;
      
      // If using URL mode, scrape the job posting first
      if (jobInputMode === 'url') {
        setLoadingStep('Connecting to webpage...');
        setLoadingProgress(15);

        const scrapeResponse = await fetch(endpoints.scrape, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: jobUrl }),
        });

        setLoadingStep('Extracting job details with AI...');
        setLoadingProgress(45);

        const scrapeResult: ScrapeApiResponse = await scrapeResponse.json();

        if (!scrapeResponse.ok || isScrapeErrorResponse(scrapeResult)) {
          const errorMessage = isScrapeErrorResponse(scrapeResult) 
            ? scrapeResult.error 
            : 'Failed to scrape job posting';
          throw new Error(errorMessage);
        }

        if (isScrapeSuccessResponse(scrapeResult)) {
          finalJobPosting = scrapeResult.jobPosting;
          
          // Show different message based on cache hit/miss
          const stepMessage = scrapeResult.fromCache 
            ? 'Retrieved from cache (saving time & cost!)' 
            : 'Job posting extracted successfully!';
          setLoadingStep(stepMessage);
          setLoadingProgress(70);
        }
      }

      // Now analyze with the final job posting text
      setLoadingStep('Analyzing resume against job requirements...');
      setLoadingProgress(80);

      // Convert file to base64 (Cloud Functions Gen2 best practice)
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const base64 = btoa(String.fromCharCode(...bytes));

      const response = await fetch(endpoints.analyze, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeBase64: base64,
          fileName: file.name,
          mimeType: file.type,
          jobPosting: finalJobPosting,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze resume');
      }

      setLoadingProgress(95);
      setLoadingStep('Preparing results...');

      const result = await response.json();
      setAnalysisResult(result);
      
      setLoadingProgress(100);
      setLoadingStep('Complete!');
      
      // Brief delay to show completion before navigation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push('/results');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
      setLoadingStep('');
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Your Resume
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div>
                <p className="text-sm text-gray-600">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Size: {(file.size / 1024 / 1024).toFixed(2)}MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  {isDragActive
                    ? 'Drop your resume here'
                    : 'Drag and drop your resume, or click to select'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports Word documents (.docx) and text files (.txt)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum file size: 2MB
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Job Posting Information
          </label>
          
          {/* Toggle between URL and text input */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-4">
            <button
              type="button"
              onClick={() => setJobInputMode('url')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                jobInputMode === 'url'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔗 Enter URL
            </button>
            <button
              type="button"
              onClick={() => setJobInputMode('text')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                jobInputMode === 'text'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📝 Paste Text
            </button>
          </div>

          {/* Conditional input based on mode */}
          {jobInputMode === 'text' ? (
            <textarea
              id="jobPosting"
              value={jobPosting}
              onChange={(e) => setJobPosting(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Paste the job posting text here..."
            />
          ) : (
            <div>
              <input
                type="url"
                id="jobUrl"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://company.com/careers/job-posting"
              />
              <p className="text-xs text-gray-500 mt-2">
                Supports most job board URLs (LinkedIn, Indeed, company career pages, etc.)
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading 
            ? (jobInputMode === 'url' ? 'Scraping & Analyzing...' : 'Analyzing...') 
            : 'Analyze Resume'
          }
        </button>

        <p className="text-xs text-gray-500 text-center mt-2">
          This app is currently in beta and under active development - features may change and some functionality may be limited.
        </p>
      </form>
      <LoadingModal 
        isOpen={isLoading} 
        progress={loadingProgress}
        currentStep={loadingStep}
        isUrlMode={jobInputMode === 'url'}
      />
    </div>
  );
} 