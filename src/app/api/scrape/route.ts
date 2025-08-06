import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { 
  getCachedJobPosting, 
  setCachedJobPosting, 
  generateUrlHash 
} from '@/lib/redis';
import { ScrapeResponse, ScrapeErrorResponse, ScrapeApiResponse } from '@/types/scraping';

// Initialize OpenAI chat model
const chatModel = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.1,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Create a prompt template for job posting extraction
const jobExtractionPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert at extracting job posting information from web page content.

Extract the following information from the provided webpage content and return it as clean, structured text:

1. Job Title
2. Company Name
3. Job Description/Summary
4. Required Qualifications/Skills
5. Responsibilities/Duties
6. Experience Requirements
7. Any other relevant job details

Format the output as a clean, well-structured job posting that could be used for resume analysis.
If the content doesn't appear to be a valid job posting, respond with "INVALID_JOB_POSTING".

Webpage Content:
{content}

Extracted Job Posting:
`);

// Note: generateUrlHash moved to utils/redis.ts for reusability

// Helper function to scrape webpage content
async function scrapeWebpage(url: string): Promise<string> {
  console.log('Starting webpage scrape for:', url);
  
  // Configure browser options for serverless environment
  const isProduction = process.env.NODE_ENV === 'production';
  
  const browserOptions = isProduction 
    ? {
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
        ignoreHTTPSErrors: true,
      }
    : {
        // Local development - use system Chrome
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      };

  const browser = await puppeteer.launch(browserOptions);
  
  try {
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set reasonable timeout
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract text content from the page
    const content = await page.evaluate(() => {
      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style, nav, header, footer, aside');
      scripts.forEach(el => el.remove());
      
      // Get main content area or body text
      const mainContent = document.querySelector('main') || 
                         document.querySelector('[role="main"]') ||
                         document.querySelector('.job-description') ||
                         document.querySelector('.job-content') ||
                         document.body;
      
      return mainContent?.innerText || document.body.innerText;
    });
    
    console.log('Scraped content length:', content.length);
    return content;
    
  } finally {
    await browser.close();
  }
}

// Helper function to extract job posting using LangChain
async function extractJobPosting(content: string): Promise<string> {
  console.log('Extracting job posting with AI, content length:', content.length);
  
  // Truncate content if too long to avoid token limits
  const truncatedContent = content.length > 10000 
    ? content.substring(0, 10000) + '...'
    : content;
  
  const chain = jobExtractionPrompt.pipe(chatModel).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    content: truncatedContent,
  });
  
  console.log('AI extraction result length:', result.length);
  return result;
}

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ScrapeApiResponse>> {
  console.log('Received POST request to /api/scrape');
  
  try {
    const { url } = await request.json();
    
    if (!url || typeof url !== 'string') {
      const errorResponse: ScrapeErrorResponse = {
        success: false,
        error: 'URL is required and must be a string'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    if (!isValidUrl(url)) {
      const errorResponse: ScrapeErrorResponse = {
        success: false,
        error: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    console.log('Processing URL:', url);
    
    // Generate hash for the URL
    const urlHash = generateUrlHash(url);
    console.log('Generated URL hash:', urlHash);
    
    // Check Redis cache first
    try {
      const cachedResult = await getCachedJobPosting(url);
      
      if (cachedResult) {
        console.log('Returning cached job posting');
        const response: ScrapeResponse = {
          success: true,
          jobPosting: cachedResult.jobPosting,
          urlHash: cachedResult.urlHash,
          extractedAt: cachedResult.extractedAt,
          fromCache: true
        };
        return NextResponse.json(response);
      }
    } catch (cacheError) {
      console.warn('Cache check failed, proceeding with fresh scrape:', cacheError);
    }
    
    try {
      // Scrape the webpage (cache miss or cache unavailable)
      console.log('Cache miss - performing fresh scrape');
      const scrapedContent = await scrapeWebpage(url);
      
      if (!scrapedContent || scrapedContent.trim().length < 100) {
        const errorResponse: ScrapeErrorResponse = {
          success: false,
          error: 'Could not extract sufficient content from the webpage. The page might be protected or contain minimal text.'
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }
      
      // Extract job posting using AI
      const extractedJobPosting = await extractJobPosting(scrapedContent);
      
      if (extractedJobPosting.includes('INVALID_JOB_POSTING')) {
        const errorResponse: ScrapeErrorResponse = {
          success: false,
          error: 'The provided URL does not appear to contain a valid job posting. Please check the URL and try again.'
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }
      
      // Store in Redis cache (30 day TTL)
      try {
        await setCachedJobPosting(url, extractedJobPosting, 720);
      } catch (cacheError) {
        console.warn('Failed to cache result, but continuing:', cacheError);
      }
      
      const response: ScrapeResponse = {
        success: true,
        jobPosting: extractedJobPosting,
        urlHash: urlHash,
        extractedAt: new Date().toISOString(),
        fromCache: false
      };
      return NextResponse.json(response);
      
    } catch (scrapeError) {
      console.error('Scraping error:', scrapeError);
      const errorResponse: ScrapeErrorResponse = {
        success: false,
        error: 'Failed to scrape webpage. The site might be protected, require authentication, or be temporarily unavailable.',
        details: scrapeError instanceof Error ? scrapeError.message : 'Unknown error'
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error processing scrape request:', error);
    const errorResponse: ScrapeErrorResponse = {
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'An unknown error occurred'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}