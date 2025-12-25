// Shared prompt templates for OpenAI API calls
// Migrated from src/lib/prompts.ts for use across GCP services

/**
 * System prompt for resume analysis
 */
const SYSTEM_PROMPT = `You are an expert resume analyzer and career advisor. Your task is to analyze resumes against specific job postings and provide detailed, actionable feedback.

CRITICAL REQUIREMENTS:
1. Always respond with valid JSON format
2. Provide exactly 5 recommendations 
3. Provide exactly 5 items in each jobAnalysis array
4. Use only these valid scores: Poor, Fair, Good, Great, Excellent
5. Use only these valid impacts: High, Medium, Low  
6. Use only these valid categories: Skills, Experience, Keywords, Qualifications

If the job posting appears to be invalid, incomplete, or not a real job posting, respond with:
{
  "error": "invalid_job_posting",
  "message": "The provided text does not appear to be a valid job posting.",
  "suggestions": ["Provide a complete job description", "Include required qualifications", "Verify the job posting content"]
}

For valid job postings, analyze the resume comprehensively and provide structured feedback that helps the candidate align their resume with the job requirements.`;

/**
 * Create user prompt for resume analysis
 */
function createUserPrompt(resumeText, jobPosting) {
  return `Please analyze this resume against the job posting and provide detailed feedback.

RESUME:
${resumeText}

JOB POSTING:  
${jobPosting}

Provide your analysis in this exact JSON format:
{
  "overallScore": "Poor|Fair|Good|Great|Excellent",
  "categoryScores": {
    "skillsMatch": "Poor|Fair|Good|Great|Excellent",
    "experienceLevel": "Poor|Fair|Good|Great|Excellent", 
    "keywordOptimization": "Poor|Fair|Good|Great|Excellent",
    "qualificationsAlignment": "Poor|Fair|Good|Great|Excellent"
  },
  "executiveSummary": "2-3 sentence overview of how well the resume matches the job",
  "jobAnalysis": {
    "requiredSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
    "keyExperiences": ["experience1", "experience2", "experience3", "experience4", "experience5"],
    "primaryResponsibilities": ["responsibility1", "responsibility2", "responsibility3", "responsibility4", "responsibility5"]
  },
  "recommendations": [
    {
      "id": 1,
      "title": "Brief recommendation title",
      "description": "Detailed explanation of what to improve and how",
      "impact": "High|Medium|Low",
      "category": "Skills|Experience|Keywords|Qualifications"
    }
  ]
}`;
}

/**
 * System prompt for AI insights generation
 */
const INSIGHTS_SYSTEM_PROMPT = `You are a senior career strategist and market analyst. Your task is to provide strategic insights about job opportunities based on job analysis data.

Analyze the provided job analysis and generate insights in three key areas:
1. Market Context - Industry trends, demand, competition level
2. Position Analysis - Role expectations, growth potential, skill requirements
3. Strategic Advice - Career positioning, preparation recommendations, differentiation strategies

Be specific, actionable, and market-aware in your insights. Focus on helping the candidate understand the broader context and positioning strategies.`;

/**
 * Create insights prompt
 */
function createInsightsPrompt(jobAnalysis) {
  return `Based on this job analysis data, provide strategic insights for the candidate:

JOB ANALYSIS:
${JSON.stringify(jobAnalysis, null, 2)}

Provide insights in this format:

**Market Context:**
- Industry trends and demand levels
- Competition and market positioning
- Salary expectations and growth potential

**Position Analysis:**  
- Key success factors for this role
- Critical skill gaps in the market
- Career progression opportunities

**Strategic Advice:**
- How to differentiate from other candidates
- Preparation and development recommendations
- Networking and application strategies

Keep insights concise but actionable, focusing on strategic career guidance.`;
}

module.exports = {
  SYSTEM_PROMPT,
  INSIGHTS_SYSTEM_PROMPT,
  createUserPrompt,
  createInsightsPrompt
};