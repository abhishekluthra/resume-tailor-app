'use client';

import { JobAnalysis } from '@/types/resume-analysis';
import { AIInsights } from './AIInsights';

interface JobAnalysisTabProps {
  jobAnalysis: JobAnalysis;
}

export function JobAnalysisTab({ jobAnalysis }: JobAnalysisTabProps) {
  return (
    <div className="space-y-6">
      {/* Existing Job Analysis Sections */}
      <div>
        <h3 className="text-md font-medium text-gray-700 mb-2">Required Skills</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          {jobAnalysis.requiredSkills.map((skill, index) => (
            <li key={index}>{skill}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-md font-medium text-gray-700 mb-2">Key Experiences</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          {jobAnalysis.keyExperiences.map((exp, index) => (
            <li key={index}>{exp}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-md font-medium text-gray-700 mb-2">Primary Responsibilities</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          {jobAnalysis.primaryResponsibilities.map((resp, index) => (
            <li key={index}>{resp}</li>
          ))}
        </ul>
      </div>

      {/* AI Insights Section */}
      <div className="pt-6 border-t border-gray-200">
        <AIInsights jobAnalysis={jobAnalysis} />
      </div>
    </div>
  );
}