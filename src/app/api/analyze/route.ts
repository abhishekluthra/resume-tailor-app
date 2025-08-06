import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import OpenAI from 'openai';
import { 
  AnalysisResult,
  AnalysisResponse,
  isInvalidJobPostingError,
  Recommendation 
} from '@/types/resume-analysis';
import { SYSTEM_PROMPT, createUserPrompt } from '@/lib/prompts';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



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