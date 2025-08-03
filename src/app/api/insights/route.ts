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

    const content = completion.choices[0].message.content || '{}';
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '');
    const response = JSON.parse(cleanedContent);
    
    return {
      insights: response.insights || [],
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating AI insights:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('Received POST request to /api/insights');
  
  try {
    const { jobAnalysis } = await request.json();
    
    if (!jobAnalysis || !jobAnalysis.requiredSkills || !jobAnalysis.keyExperiences || !jobAnalysis.primaryResponsibilities) {
      return NextResponse.json(
        { error: 'Job analysis data is required' },
        { status: 400 }
      );
    }
    
    console.log('Processing job analysis for insights generation');
    
    // Generate hash for caching
    const analysisHash = generateJobAnalysisHash(jobAnalysis);
    const cacheKey = `insights:${analysisHash}`;
    console.log('Generated analysis hash:', analysisHash);
    
    // Check Redis cache first
    try {
      const cachedResult = await getCachedJobPosting(cacheKey);
      
      if (cachedResult) {
        console.log('Returning cached insights');
        const parsedInsights = JSON.parse(cachedResult.jobPosting);
        return NextResponse.json(parsedInsights);
      }
    } catch (cacheError) {
      console.warn('Cache check failed, proceeding with fresh generation:', cacheError);
    }
    
    try {
      // Generate fresh insights (cache miss or cache unavailable)
      console.log('Cache miss - generating fresh insights');
      const insights = await generateAIInsights(jobAnalysis);
      
      // Store in Redis cache (30 day TTL, same as job postings)
      try {
        await setCachedJobPosting(cacheKey, JSON.stringify(insights), 720);
        console.log('Insights cached successfully');
      } catch (cacheError) {
        console.warn('Failed to cache insights, but continuing:', cacheError);
      }
      
      return NextResponse.json(insights);
      
    } catch (generationError) {
      console.error('Insights generation error:', generationError);
      return NextResponse.json(
        { error: 'Failed to generate insights. Please try again.' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error processing insights request:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}