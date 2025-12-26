const functions = require('@google-cloud/functions-framework');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const mammoth = require('mammoth');
const OpenAI = require('openai');
// No multipart parsing library needed - using JSON with base64

// Initialize Secret Manager client
const secretClient = new SecretManagerServiceClient();

// OpenAI client (initialized lazily with secret)
let openai = null;

// Inlined utilities (from shared package)
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

function isInvalidJobPostingError(response) {
  return response && response.error === 'invalid_job_posting';
}

function validateAnalysisStructure(analysis) {
  const requiredFields = [
    'overallScore',
    'categoryScores', 
    'executiveSummary',
    'jobAnalysis',
    'recommendations'
  ];
  
  const VALID_SCORES = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];
  const VALID_IMPACTS = ['High', 'Medium', 'Low'];
  const VALID_CATEGORIES = ['Skills', 'Experience', 'Keywords', 'Qualifications'];
  
  // Check required top-level fields
  for (const field of requiredFields) {
    if (!analysis[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate scores
  if (!VALID_SCORES.includes(analysis.overallScore)) {
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
    
    if (!VALID_IMPACTS.includes(rec.impact)) {
      throw new Error(`Invalid impact level for recommendation ${index + 1}: ${rec.impact}`);
    }
    
    if (!VALID_CATEGORIES.includes(rec.category)) {
      throw new Error(`Invalid category for recommendation ${index + 1}: ${rec.category}`);
    }
  });
  
  return true;
}

/**
 * Initialize OpenAI client with API key from Secret Manager
 */
async function initializeOpenAI() {
  if (!openai) {
    try {
      console.log('Initializing OpenAI client...');
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'nurel-app-dev';
      const secretName = `projects/${projectId}/secrets/openai-api-key/versions/latest`;
      console.log('Fetching secret:', secretName);

      const [version] = await secretClient.accessSecretVersion({
        name: secretName,
      });
      console.log('Secret fetched successfully');

      const apiKey = version.payload.data.toString();
      openai = new OpenAI({ apiKey });

      console.log('OpenAI client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      throw new Error(`OpenAI API configuration error: ${error.message}`);
    }
  }
  return openai;
}

/**
 * Extract text from different file types
 */
async function extractTextFromFile(buffer, mimeType) {
  try {
    switch (mimeType) {
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      
      case 'text/plain':
        return buffer.toString('utf-8');
      
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error(`Failed to extract text from ${mimeType} file`);
  }
}

/**
 * Analyze resume with OpenAI
 */
async function analyzeResume(resumeText, jobPosting) {
  try {
    const openaiClient = await initializeOpenAI();
    
    const completion = await openaiClient.chat.completions.create({
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
    const response = JSON.parse(cleanedContent);
    
    // Check if it's an error response first
    if (isInvalidJobPostingError(response)) {
      return response;
    }
    
    // Validate analysis structure
    validateAnalysisStructure(response);
    
    return response;
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw error;
  }
}

/**
 * Main Cloud Function handler
 */
functions.http('analyze', async (req, res) => {
  console.log('Analyze function called');
  
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    console.log('Parsing JSON request body...');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);

    // Parse JSON body (Cloud Functions Gen2 best practice for file uploads)
    const { resumeBase64, fileName, mimeType, jobPosting } = req.body;

    console.log('Request body keys:', Object.keys(req.body));
    console.log('File name:', fileName);
    console.log('MIME type:', mimeType);
    console.log('Job posting:', jobPosting ? 'present' : 'missing');
    console.log('Resume base64:', resumeBase64 ? `${resumeBase64.length} chars` : 'missing');

    if (!resumeBase64 || !jobPosting) {
      return res.status(400).json({
        error: 'Resume file (base64) and job posting are required'
      });
    }

    // Decode base64 to buffer
    const fileBuffer = Buffer.from(resumeBase64, 'base64');
    console.log(`Decoded file buffer: ${fileBuffer.length} bytes`);

    // Check file size
    if (fileBuffer.length > 2 * 1024 * 1024) {
      return res.status(400).json({
        error: 'File size exceeds 2MB limit'
      });
    }

    const fileMimeType = mimeType || 'text/plain';
    console.log(`Processing file: ${fileName}, type: ${fileMimeType}, size: ${fileBuffer.length}`);

    const resumeText = await extractTextFromFile(fileBuffer, fileMimeType);
    console.log(`Resume text extracted, length: ${resumeText.length}`);

    console.log('Starting OpenAI analysis...');
    const result = await analyzeResume(resumeText, jobPosting);
    console.log('Analysis complete');

    res.json(result);
    
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error: 'Failed to process request',
      details: error.message
    });
  }
});