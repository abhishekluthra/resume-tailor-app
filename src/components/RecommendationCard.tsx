'use client';

import { Recommendation } from '@/types/resume-analysis';
import { getImpactColor } from '@/utils/colors';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'skills': return '🛠️';
      case 'experience': return '📈';
      case 'keywords': return '🔍';
      case 'qualifications': return '🎓';
      default: return '💡';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 min-h-[120px]">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
        <div className="flex items-center">
          <span className="text-xl mr-2" role="img" aria-label={recommendation.category}>
            {getCategoryIcon(recommendation.category)}
          </span>
          <h4 className="font-medium text-gray-900 text-sm">
            {recommendation.title}
          </h4>
        </div>
        <span 
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium self-start ${getImpactColor(recommendation.impact)}`}
        >
          {recommendation.impact} Impact
        </span>
      </div>

      {/* Card Content */}
      <p className="text-gray-600 text-sm leading-relaxed mb-3">
        {recommendation.description}
      </p>

      {/* Card Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="inline-block text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
          {recommendation.category}
        </span>
        <span className="text-xs text-gray-400">
          ID: {recommendation.id}
        </span>
      </div>
    </div>
  );
}