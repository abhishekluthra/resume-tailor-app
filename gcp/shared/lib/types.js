// Shared type definitions for GCP services
// Migrated from src/types/ for use across Cloud Functions and Cloud Run

/**
 * Analysis response types
 */
const AnalysisResponse = {
  VALID_SCORES: ['Poor', 'Fair', 'Good', 'Great', 'Excellent'],
  VALID_IMPACTS: ['High', 'Medium', 'Low'],
  VALID_CATEGORIES: ['Skills', 'Experience', 'Keywords', 'Qualifications']
};

/**
 * Scraping response types
 */
const ScrapingResponse = {
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * Validate analysis structure for consistent format across services
 */
function validateAnalysisStructure(analysis) {
  const requiredFields = [
    'overallScore',
    'categoryScores', 
    'executiveSummary',
    'jobAnalysis',
    'recommendations'
  ];
  
  // Check required top-level fields
  for (const field of requiredFields) {
    if (!analysis[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate scores
  if (!AnalysisResponse.VALID_SCORES.includes(analysis.overallScore)) {
    throw new Error(`Invalid overall score: ${analysis.overallScore}`);
  }
  
  // Validate job analysis arrays
  const jobAnalysis = analysis.jobAnalysis;
  if (!Array.isArray(jobAnalysis.requiredSkills) || jobAnalysis.requiredSkills.length !== 5) {
    throw new Error('requiredSkills must be an array of exactly 5 items');
  }
  
  if (!Array.isArray(jobAnalysis.keyExperiences) || jobAnalysis.keyExperiences.length !== 5) {
    throw new Error('keyExperiences must be an array of exactly 5 items');
  }
  
  if (!Array.isArray(jobAnalysis.primaryResponsibilities) || jobAnalysis.primaryResponsibilities.length !== 5) {
    throw new Error('primaryResponsibilities must be an array of exactly 5 items');
  }
  
  // Validate recommendations
  if (!Array.isArray(analysis.recommendations) || analysis.recommendations.length !== 5) {
    throw new Error('recommendations must be an array of exactly 5 items');
  }
  
  analysis.recommendations.forEach((rec, index) => {
    if (!rec.id || !rec.title || !rec.description || !rec.impact || !rec.category) {
      throw new Error(`Recommendation ${index + 1} is missing required fields`);
    }
    
    if (!AnalysisResponse.VALID_IMPACTS.includes(rec.impact)) {
      throw new Error(`Invalid impact level for recommendation ${index + 1}: ${rec.impact}`);
    }
    
    if (!AnalysisResponse.VALID_CATEGORIES.includes(rec.category)) {
      throw new Error(`Invalid category for recommendation ${index + 1}: ${rec.category}`);
    }
  });
  
  return true;
}

/**
 * Check if response is an invalid job posting error
 */
function isInvalidJobPostingError(response) {
  return response && response.error === 'invalid_job_posting';
}

module.exports = {
  AnalysisResponse,
  ScrapingResponse,
  validateAnalysisStructure,
  isInvalidJobPostingError
};