import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { JobAnalysis } from '@/types/resume-analysis';
import { createHash } from 'crypto';
import { getCachedJobPosting, setCachedJobPosting } from '@/utils/redis';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIInsight {
  category: 'market' | 'position' | 'strategic';
  title: string;
  content: string;
  icon: string;
}

interface AIInsightsResponse {
  insights: AIInsight[];
  generatedAt: string;
}

// System prompt for AI insights generation
const INSIGHTS_SYSTEM_PROMPT = `
You are an expert career advisor and job market analyst. Your role is to provide strategic insights about job positions based on job analysis data.

Analyze the provided job requirements and generate exactly 6 insights across these categories:
- 2 Job Market Context insights (salary, experience level, industry trends)
- 2 Position Analysis insights (role seniority, growth potential, skill complexity)  
- 2 Strategic Insights (critical skills, keyword optimization, competitive advantages)

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

Keep insights concise, specific, and valuable for job seekers.
`;

// Generate hash for job analysis data (for caching)
function generateJobAnalysisHash(jobAnalysis: JobAnalysis): string {
  const dataString = JSON.stringify({
    requiredSkills: jobAnalysis.requiredSkills.sort(),
    keyExperiences: jobAnalysis.keyExperiences.sort(),
    primaryResponsibilities: jobAnalysis.primaryResponsibilities.sort()
  });
  return createHash('sha256').update(dataString).digest('hex');
}

// Generate AI insights using OpenAI
async function generateAIInsights(jobAnalysis: JobAnalysis): Promise<AIInsightsResponse> {
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
    const completion = await openai.chat.completions.create({
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
    console.log(`[${functionId}] API response details:`, {
      usage: completion.usage,
      model: completion.model,
      choices: completion.choices.length
    });

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

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] Received POST request to /api/insights`);
  
  try {
    console.log(`[${requestId}] Parsing request body...`);
    const { jobAnalysis } = await request.json();
    console.log(`[${requestId}] Request body parsed successfully`);
    
    // Validate job analysis data
    if (!jobAnalysis || !jobAnalysis.requiredSkills || !jobAnalysis.keyExperiences || !jobAnalysis.primaryResponsibilities) {
      console.log(`[${requestId}] Validation failed - missing required fields:`, {
        hasJobAnalysis: !!jobAnalysis,
        hasRequiredSkills: !!(jobAnalysis?.requiredSkills),
        hasKeyExperiences: !!(jobAnalysis?.keyExperiences),
        hasPrimaryResponsibilities: !!(jobAnalysis?.primaryResponsibilities)
      });
      return NextResponse.json(
        { error: 'Job analysis data is required' },
        { status: 400 }
      );
    }
    
    console.log(`[${requestId}] Job analysis validation passed. Data:`, {
      requiredSkillsCount: jobAnalysis.requiredSkills.length,
      keyExperiencesCount: jobAnalysis.keyExperiences.length,
      primaryResponsibilitiesCount: jobAnalysis.primaryResponsibilities.length
    });
    
    // Generate hash for caching
    console.log(`[${requestId}] Generating hash for caching...`);
    const analysisHash = generateJobAnalysisHash(jobAnalysis);
    const cacheKey = `insights:${analysisHash}`;
    console.log(`[${requestId}] Generated analysis hash: ${analysisHash}, cache key: ${cacheKey}`);
    
    // Check Redis cache first
    console.log(`[${requestId}] Checking Redis cache for existing insights...`);
    try {
      const cachedResult = await getCachedJobPosting(cacheKey);
      
      if (cachedResult) {
        console.log(`[${requestId}] Cache HIT - returning cached insights`);
        const parsedInsights = JSON.parse(cachedResult.jobPosting);
        console.log(`[${requestId}] Successfully parsed cached insights:`, {
          insightsCount: parsedInsights.insights?.length || 0,
          generatedAt: parsedInsights.generatedAt
        });
        return NextResponse.json(parsedInsights);
      } else {
        console.log(`[${requestId}] Cache MISS - no cached insights found`);
      }
    } catch (cacheError) {
      console.error(`[${requestId}] Cache check failed, proceeding with fresh generation:`, {
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
        stack: cacheError instanceof Error ? cacheError.stack : undefined
      });
    }
    
    try {
      // Generate fresh insights (cache miss or cache unavailable)
      console.log(`[${requestId}] Cache miss - generating fresh insights with OpenAI...`);
      console.log(`[${requestId}] OpenAI API key present:`, !!process.env.OPENAI_API_KEY);
      
      const startTime = Date.now();
      const insights = await generateAIInsights(jobAnalysis);
      const generationTime = Date.now() - startTime;
      
      console.log(`[${requestId}] Fresh insights generated successfully in ${generationTime}ms:`, {
        insightsCount: insights.insights?.length || 0,
        generatedAt: insights.generatedAt,
        categories: insights.insights?.map(i => i.category) || []
      });
      
      // Store in Redis cache (30 day TTL, same as job postings)
      console.log(`[${requestId}] Attempting to cache insights...`);
      try {
        await setCachedJobPosting(cacheKey, JSON.stringify(insights), 720);
        console.log(`[${requestId}] Insights cached successfully with 30-day TTL`);
      } catch (cacheError) {
        console.error(`[${requestId}] Failed to cache insights, but continuing:`, {
          error: cacheError instanceof Error ? cacheError.message : String(cacheError),
          stack: cacheError instanceof Error ? cacheError.stack : undefined
        });
      }
      
      console.log(`[${requestId}] Returning fresh insights to client`);
      return NextResponse.json(insights);
      
    } catch (generationError) {
      console.error(`[${requestId}] Insights generation error:`, {
        error: generationError instanceof Error ? generationError.message : String(generationError),
        stack: generationError instanceof Error ? generationError.stack : undefined,
        name: generationError instanceof Error ? generationError.name : 'Unknown'
      });
      return NextResponse.json(
        { error: 'Failed to generate insights. Please try again.' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error(`[${requestId}] Unexpected error processing insights request:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}