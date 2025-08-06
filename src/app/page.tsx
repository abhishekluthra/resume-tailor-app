'use client';

import { UploadForm } from '@/components/UploadForm';
import { DisclaimerModal } from '@/components/DisclaimerModal';
import { useDisclaimer } from '@/context/DisclaimerContext';

export default function Home() {
  const { hasAcceptedDisclaimer, setHasAcceptedDisclaimer } = useDisclaimer();

  return (
    <>
      <DisclaimerModal 
        isOpen={!hasAcceptedDisclaimer}
        onAccept={() => setHasAcceptedDisclaimer(true)}
      />
      
      {hasAcceptedDisclaimer && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          {/* Hero Section */}
          <div className="relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
              <div className="text-center">
                {/* Main Heading */}
                <div className="space-y-4 mb-8">
                  <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      AlignMyResume
                    </span>
                  </h1>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 max-w-4xl mx-auto">
                    Align your resume with your dream job
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Get personalized analysis and AI-powered recommendations to perfectly align your resume for any job posting
                  </p>
                </div>

                {/* Feature Pills */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    ✨ AI-Powered Analysis
                  </span>
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    🎯 Job-Specific Tailoring
                  </span>
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    📊 Detailed Insights
                  </span>
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    ⚡ Instant Results
                  </span>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Align your resume perfectly in three simple steps
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">Upload Documents</h4>
                <p className="text-gray-600">
                  Upload your current resume and the job posting you want to align with
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">AI Analysis</h4>
                <p className="text-gray-600">
                  Our AI analyzes how well your resume aligns with the job requirements and industry standards
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">Get Alignment Report</h4>
                <p className="text-gray-600">
                  Receive detailed feedback and actionable suggestions to perfectly align your resume
                </p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to get started?
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload your resume and job posting below to receive your personalized alignment analysis
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-8 py-12">
                  <UploadForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}