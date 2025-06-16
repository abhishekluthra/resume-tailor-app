import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import OpenAI from 'openai';
import { 
  AnalysisResult,
  AnalysisResponse,
  isInvalidJobPostingError,
  Recommendation 
} from '@/types/resume-analysis';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System Prompt for OpenAI API
const SYSTEM_PROMPT = `You are an expert resume and job analysis assistant. You analyze resumes against job postings and provide structured feedback.

CRITICAL VALIDATION RULES:
1. Before analyzing, determine if the provided job posting text is actually a legitimate job posting
2. If the job posting is blank, too short, or clearly not a real job posting, you MUST respond with this exact JSON:
INVALID JOB POSTING FORMAT (only use when job posting is invalid):
{
  "error": "invalid_job_posting",
  "message": "The provided text does not appear to be a valid job posting. Please provide a complete job description with requirements, responsibilities, and qualifications.",
  "suggestions": [
    "Include job title and company information",
    "Add detailed job responsibilities and duties", 
    "Include required qualifications and skills",
    "Specify experience requirements",
    "Add any preferred qualifications"
  ]
}

3. A valid job posting should contain:
   - Clear job responsibilities or duties
   - Required qualifications or skills
   - At least 100 words of meaningful content
   - Job-related terminology

4. Do NOT make up or hallucinate job requirements if the posting is incomplete
5. Do NOT provide analysis for test content, placeholder text, or obviously fake postings

If the job posting IS valid, respond with the standard JSON format as specified.

CRITICAL: If the job posting is valid, you must ALWAYS respond with a valid JSON in exactly the following format. Do not include any text before or after the JSON.

STANDARD RESPONSE FORMAT (only use when job posting is valid):

{
  "overallScore": "Poor|Fair|Good|Great|Excellent",
  "categoryScores": {
    "skillsMatch": "Poor|Fair|Good|Great|Excellent",
    "experienceLevel": "Poor|Fair|Good|Great|Excellent",
    "keywordOptimization": "Poor|Fair|Good|Great|Excellent",
    "qualificationsAlignment": "Poor|Fair|Good|Great|Excellent"
  },
  "executiveSummary": "2-3 sentence summary of key insights",
  "jobAnalysis": {
    "requiredSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
    "keyExperiences": ["experience1", "experience2", "experience3", "experience4", "experience5"],
    "primaryResponsibilities": ["responsibility1", "responsibility2", "responsibility3", "responsibility4", "responsibility5"]
  },
  "recommendations": [
    {
      "id": 1,
      "title": "Brief title for the recommendation",
      "description": "Detailed explanation of what to change and why",
      "impact": "High|Medium|Low",
      "category": "Skills|Experience|Keywords|Qualifications"
    },
    {
      "id": 2,
      "title": "Brief title for the recommendation",
      "description": "Detailed explanation of what to change and why",
      "impact": "High|Medium|Low",
      "category": "Skills|Experience|Keywords|Qualifications"
    },
    {
      "id": 3,
      "title": "Brief title for the recommendation",
      "description": "Detailed explanation of what to change and why",
      "impact": "High|Medium|Low",
      "category": "Skills|Experience|Keywords|Qualifications"
    },
    {
      "id": 4,
      "title": "Brief title for the recommendation",
      "description": "Detailed explanation of what to change and why",
      "impact": "High|Medium|Low",
      "category": "Skills|Experience|Keywords|Qualifications"
    },
    {
      "id": 5,
      "title": "Brief title for the recommendation",
      "description": "Detailed explanation of what to change and why",
      "impact": "High|Medium|Low",
      "category": "Skills|Experience|Keywords|Qualifications"
    }
  ]
}

Rules:
- Always provide exactly 5 items in requiredSkills, keyExperiences, and primaryResponsibilities arrays
- Always provide exactly 5 recommendations
- Each recommendation must have a unique id (1-5)
- Impact must be exactly "High", "Medium", or "Low"
- Scores must be exactly one of: "Poor", "Fair", "Good", "Great", "Excellent"
- Category must be exactly one of: "Skills", "Experience", "Keywords", "Qualifications"
- Executive summary must be educational and actionable
- Recommendations should be prioritized by impact (High impact first)`;

// User Prompt Template
const createUserPrompt = (resumeText: string, jobPostingText: string) => {
  return `Please analyze this resume against the job posting and provide structured feedback.

RESUME TEXT:
${resumeText}

JOB POSTING TEXT:
${jobPostingText}

Analyze the resume's alignment with this job posting. Focus on:
1. How well the resume matches the required skills
2. Whether the experience level aligns with job requirements
3. Keyword optimization for ATS systems
4. Overall qualifications alignment

Provide actionable recommendations that will help the candidate improve their resume for this specific job. Prioritize recommendations by impact - focus on changes that will most significantly improve their chances.

Remember: Respond ONLY with the JSON format specified in the system prompt.`;
};

// Helper function to extract text from different file types
async function extractTextFromFile(buffer: Buffer, fileType: string): Promise<string> {
  console.log('Extracting text from file type:', fileType);
  try {
    switch (fileType) {
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        console.log('Processing Word document...');
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      
      case 'text/plain':
        console.log('Processing text file...');
        return buffer.toString('utf-8');
      
      default:
        throw new Error(`Unsupported file type: ${fileType}. Please upload a Word document (.docx) or text file (.txt)`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error(`Failed to extract text from ${fileType} file`);
  }
}

// Helper function to analyze resume with OpenAI
async function analyzeResume(resumeText: string, jobPosting: string): Promise<AnalysisResponse> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: createUserPrompt(resumeText, jobPosting)
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content || '{}';
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '');
    const response = JSON.parse(cleanedContent) as AnalysisResponse;
    
    // Check if it's an error response first
    if (isInvalidJobPostingError(response)) {
      return response;
    }
    
    // If it's not an error, validate as normal analysis result
    const analysis = response as AnalysisResult;
    validateAnalysisStructure(analysis);
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw error;
  }
}

const validateAnalysisStructure = (analysis: AnalysisResult): boolean => {
  const requiredFields = [
    'overallScore',
    'categoryScores',
    'executiveSummary',
    'jobAnalysis',
    'recommendations'
  ];
  
  const validScores = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];
  const validImpacts = ['High', 'Medium', 'Low'];
  const validCategories = ['Skills', 'Experience', 'Keywords', 'Qualifications'];
  
  // Check required top-level fields
  for (const field of requiredFields) {
    if (!analysis[field as keyof AnalysisResult]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate scores
  if (!validScores.includes(analysis.overallScore)) {
    throw new Error(`Invalid overall score: ${analysis.overallScore}`);
  }
  
  // Validate category scores
  const categoryScores = analysis.categoryScores;
  for (const [key, value] of Object.entries(categoryScores)) {
    if (!validScores.includes(value)) {
      throw new Error(`Invalid category score for ${key}: ${value}`);
    }
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
  
  analysis.recommendations.forEach((rec: Recommendation, index: number) => {
    if (!rec.id || !rec.title || !rec.description || !rec.impact || !rec.category) {
      throw new Error(`Recommendation ${index + 1} is missing required fields`);
    }
    
    if (!validImpacts.includes(rec.impact)) {
      throw new Error(`Invalid impact level for recommendation ${index + 1}: ${rec.impact}`);
    }
    
    if (!validCategories.includes(rec.category)) {
      throw new Error(`Invalid category for recommendation ${index + 1}: ${rec.category}`);
    }
  });
  
  return true;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

export async function POST(request: NextRequest) {
  console.log('Received POST request to /api/analyze');
  try {
    const formData = await request.formData();
    console.log('Form data received:', Array.from(formData.keys()));
    
    const resumeFile = formData.get('resume') as File;
    const jobPosting = formData.get('jobPosting') as string;

    if (!resumeFile || !jobPosting) {
      console.log('Missing required fields:', { resumeFile: !!resumeFile, jobPosting: !!jobPosting });
      return NextResponse.json(
        { error: 'Resume file and job posting are required' },
        { status: 400 }
      );
    }

    // Check file size
    if (resumeFile.size > MAX_FILE_SIZE) {
      console.log('File size exceeds limit:', resumeFile.size);
      return NextResponse.json(
        { error: 'File size exceeds 2MB limit. Please upload a smaller file.' },
        { status: 400 }
      );
    }

    console.log('Processing resume file:', resumeFile.name, resumeFile.type);
    const buffer = Buffer.from(await resumeFile.arrayBuffer());
    const resumeText = await extractTextFromFile(buffer, resumeFile.type);
    console.log('Resume text extracted, length:', resumeText.length);

    const result = await analyzeResume(resumeText, jobPosting);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to process request', details: errorMessage },
      { status: 500 }
    );
  }
}