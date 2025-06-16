'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { LoadingModal } from './LoadingModal';
import { useRouter } from 'next/navigation';
import { useAnalysis } from '@/context/AnalysisContext';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

export function UploadForm() {
  const router = useRouter();
  const { setAnalysisResult } = useAnalysis();
  const [file, setFile] = useState<File | null>(null);
  const [jobPosting, setJobPosting] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!file || !jobPosting) {
      setError('Please upload a resume and provide a job posting');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobPosting', jobPosting);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze resume');
      }

      const result = await response.json();
      setAnalysisResult(result);
      router.push('/results');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
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
          <label htmlFor="jobPosting" className="block text-sm font-medium text-gray-700 mb-2">
            Job Posting
          </label>
          <textarea
            id="jobPosting"
            value={jobPosting}
            onChange={(e) => setJobPosting(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Paste the job posting here..."
          />
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
          {isLoading ? 'Analyzing...' : 'Analyze Resume'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-2">
          This app is currently in beta and under active development - features may change and some functionality may be limited.
        </p>
      </form>
      <LoadingModal isOpen={isLoading} />
    </div>
  );
} 