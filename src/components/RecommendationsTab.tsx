'use client';

import { Recommendation } from '@/types/resume-analysis';
import { RecommendationCard } from './RecommendationCard';

interface RecommendationsTabProps {
  recommendations: Recommendation[];
}

export function RecommendationsTab({ recommendations }: RecommendationsTabProps) {
  // Group recommendations by category
  const groupedRecommendations = recommendations.reduce((groups, recommendation) => {
    const category = recommendation.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(recommendation);
    return groups;
  }, {} as Record<string, Recommendation[]>);

  const categories = Object.keys(groupedRecommendations);

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {category} Recommendations
          </h3>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {groupedRecommendations[category].map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}