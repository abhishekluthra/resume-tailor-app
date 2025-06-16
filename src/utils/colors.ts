export function getScoreColor(score: string) {
  switch (score) {
    case 'Excellent': return 'bg-green-100 text-green-800';
    case 'Great': return 'bg-green-50 text-green-700';
    case 'Good': return 'bg-blue-50 text-blue-700';
    case 'Fair': return 'bg-yellow-50 text-yellow-700';
    case 'Poor': return 'bg-red-50 text-red-700';
    default: return 'bg-gray-50 text-gray-700';
  }
}

export function getImpactColor(impact: string) {
  switch (impact) {
    case 'High': return 'bg-red-100 text-red-800';
    case 'Medium': return 'bg-yellow-100 text-yellow-800';
    case 'Low': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
} 