import { NextRequest, NextResponse } from 'next/server';
// Puppeteer removed in favor of Jina AI
// import puppeteer from 'puppeteer-core';
// import chromium from '@sparticuz/chromium';
// LangChain imports removed - extraction moved to Analysis phase
// import { ChatOpenAI } from '@langchain/openai';
// import { StringOutputParser } from '@langchain/core/output_parsers';
// import { ChatPromptTemplate } from '@langchain/core/prompts';
import {
  getCachedJobPosting,
  setCachedJobPosting,
  generateUrlHash
} from '@/lib/redis';
import { ScrapeResponse, ScrapeErrorResponse, ScrapeApiResponse } from '@/types/scraping';

// Initialize OpenAI chat model
// LangChain prompts removed

// Note: generateUrlHash moved to utils/redis.ts for reusability

// Helper function to scrape webpage content
// Helper function to scrape webpage content using Jina AI
async function scrapeWebpage(url: string): Promise<string> {
  console.log('Starting Jina AI scrape for:', url);

  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl, {
      method: 'GET',
      headers: {
        // 'Authorization': 'Bearer <YOUR_KEY>' // Optional: Add if you have a key
        'X-Target-Selector': 'body', // Focus on body content
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Jina AI request failed: ${response.status} ${response.statusText}`);
    }

    // Jina returns the markdown string directly
    const content = await response.text();

    console.log('Jina scrape successful, content length:', content.length);
    return content;

  } catch (error) {
    console.error('Jina scrape error:', error);
    throw error;
  }
}

// function extractJobPosting removed

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

      // OPTIMIZATION: Jina returns structured Markdown which the Analysis LLM can process directly.
      const extractedJobPosting = scrapedContent;

      // Basic validation
      if (extractedJobPosting.length < 50) {
        const errorResponse: ScrapeErrorResponse = {
          success: false,
          error: 'The provided URL returned very little content. Please check the URL.'
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