const functions = require('@google-cloud/functions-framework');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const OpenAI = require('openai');
const crypto = require('crypto');

// Initialize Secret Manager client
const secretClient = new SecretManagerServiceClient();

// OpenAI client (initialized lazily with secret)
let openai = null;

// Inlined utilities (from shared package)
const INSIGHTS_SYSTEM_PROMPT = `You are a senior career strategist and market analyst. Your task is to provide strategic insights about job opportunities based on job analysis data.

Analyze the provided job analysis and generate exactly 6 insights in three key areas:
- 2 Market Context insights (industry trends, demand, competition level)  
- 2 Position Analysis insights (role expectations, growth potential, skill requirements)
- 2 Strategic Advice insights (career positioning, preparation recommendations, differentiation strategies)

Return your response as a JSON object with this exact structure:
{
  "insights": [
    {
      "category": "market",
      "title": "Brief insight title",
      "content": "Detailed explanation in 1-2 sentences",
      "icon": "📊"
    }
  ]
}

Use these icons for categories:
- market: 📊, 💰, 🏢, 📈
- position: 🎯, 🚀, ⭐, 👥  
- strategic: 🔑, 💡, 🏆, 📝

Focus on actionable insights that help job seekers understand:
1. Market context (what this role typically offers)
2. Position characteristics (what success looks like)
3. Strategic advice (how to stand out)

Keep insights concise, specific, and valuable for job seekers.`;

/**
 * Initialize OpenAI client with API key from Secret Manager
 */
async function initializeOpenAI() {
  if (!openai) {
    try {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'nurel-app-dev';
      const secretName = `projects/${projectId}/secrets/openai-api-key/versions/latest`;
      
      const [version] = await secretClient.accessSecretVersion({
        name: secretName,
      });
      
      const apiKey = version.payload.data.toString();
      openai = new OpenAI({ apiKey });
      
      console.log('OpenAI client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      throw new Error('OpenAI API configuration error');
    }
  }
  return openai;
}

/**
 * Generate hash for job analysis for caching insights
 */
function generateJobAnalysisHash(jobAnalysis) {
  const dataString = JSON.stringify({
    requiredSkills: jobAnalysis.requiredSkills.sort(),
    keyExperiences: jobAnalysis.keyExperiences.sort(),
    primaryResponsibilities: jobAnalysis.primaryResponsibilities.sort()
  });
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Generate AI insights using OpenAI
 */
async function generateAIInsights(jobAnalysis) {
  const functionId = Math.random().toString(36).substring(7);
  console.log(`[${functionId}] Starting AI insights generation...`);
  
  try {
    const userPrompt = `
Job Analysis Data:

Required Skills:
${jobAnalysis.requiredSkills.map(skill => `• ${skill}`).join('\n')}

Key Experiences:
${jobAnalysis.keyExperiences.map(exp => `• ${exp}`).join('\n')}

Primary Responsibilities:
${jobAnalysis.primaryResponsibilities.map(resp => `• ${resp}`).join('\n')}

Generate strategic insights for this position.
`;

    console.log(`[${functionId}] Generated user prompt (${userPrompt.length} chars)`);
    console.log(`[${functionId}] Calling OpenAI API with model: gpt-4o-mini`);

    const apiStartTime = Date.now();
    const openaiClient = await initializeOpenAI();
    
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: INSIGHTS_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    
    const apiTime = Date.now() - apiStartTime;
    console.log(`[${functionId}] OpenAI API call completed in ${apiTime}ms`);

    const content = completion.choices[0].message.content || '{}';
    console.log(`[${functionId}] Raw response content length: ${content.length}`);
    
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '');
    console.log(`[${functionId}] Cleaned content length: ${cleanedContent.length}`);
    
    let response;
    try {
      response = JSON.parse(cleanedContent);
      console.log(`[${functionId}] Successfully parsed JSON response:`, {
        hasInsights: !!response.insights,
        insightsCount: response.insights?.length || 0
      });
    } catch (parseError) {
      console.error(`[${functionId}] Failed to parse JSON response:`, {
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
        rawContent: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
        cleanedContent: cleanedContent.substring(0, 500) + (cleanedContent.length > 500 ? '...' : '')
      });
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }
    
    const result = {
      insights: response.insights || [],
      generatedAt: new Date().toISOString()
    };
    
    console.log(`[${functionId}] Final insights generated:`, {
      insightsCount: result.insights.length,
      generatedAt: result.generatedAt
    });
    
    return result;
  } catch (error) {
    console.error(`[${functionId}] Error generating AI insights:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    throw error;
  }
}

/**
 * Main Cloud Function handler
 */
functions.http('insights', async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] Received POST request to insights function`);
  
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    console.log(`[${requestId}] Parsing request body...`);
    const { jobAnalysis } = req.body;
    console.log(`[${requestId}] Request body parsed successfully`);
    
    // Validate job analysis data
    if (!jobAnalysis || !jobAnalysis.requiredSkills || !jobAnalysis.keyExperiences || !jobAnalysis.primaryResponsibilities) {
      console.log(`[${requestId}] Validation failed - missing required fields:`, {
        hasJobAnalysis: !!jobAnalysis,
        hasRequiredSkills: !!(jobAnalysis?.requiredSkills),
        hasKeyExperiences: !!(jobAnalysis?.keyExperiences),
        hasPrimaryResponsibilities: !!(jobAnalysis?.primaryResponsibilities)
      });
      return res.status(400).json({
        error: 'Job analysis data is required'
      });
    }
    
    console.log(`[${requestId}] Job analysis validation passed. Data:`, {
      requiredSkillsCount: jobAnalysis.requiredSkills.length,
      keyExperiencesCount: jobAnalysis.keyExperiences.length,
      primaryResponsibilitiesCount: jobAnalysis.primaryResponsibilities.length
    });
    
    try {
      // Generate fresh insights (no caching in this simplified version)
      console.log(`[${requestId}] Generating fresh insights with OpenAI...`);
      
      const startTime = Date.now();
      const insights = await generateAIInsights(jobAnalysis);
      const generationTime = Date.now() - startTime;
      
      console.log(`[${requestId}] Fresh insights generated successfully in ${generationTime}ms:`, {
        insightsCount: insights.insights?.length || 0,
        generatedAt: insights.generatedAt,
        categories: insights.insights?.map(i => i.category) || []
      });
      
      console.log(`[${requestId}] Returning fresh insights to client`);
      res.json(insights);
      
    } catch (generationError) {
      console.error(`[${requestId}] Insights generation error:`, {
        error: generationError instanceof Error ? generationError.message : String(generationError),
        stack: generationError instanceof Error ? generationError.stack : undefined,
        name: generationError instanceof Error ? generationError.name : 'Unknown'
      });
      res.status(500).json({
        error: 'Failed to generate insights. Please try again.'
      });
    }
    
  } catch (error) {
    console.error(`[${requestId}] Unexpected error processing insights request:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    res.status(500).json({
      error: 'Failed to process request', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});