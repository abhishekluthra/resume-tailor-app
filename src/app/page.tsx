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
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Resume Analysis</h1>
            <p className="mt-2 text-lg text-gray-600">
              Upload your resume and job posting to get personalized analysis and recommendations.
            </p>
          </div>
          <UploadForm />
        </div>
      )}
    </>
  );
}
