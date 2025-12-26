const express = require('express');
const cors = require('cors');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
// LangChain imports removed - extraction moved to Analysis phase
// const { ChatOpenAI } = require('@langchain/openai');
// const { StringOutputParser } = require('@langchain/core/output_parsers');
// const { ChatPromptTemplate } = require('@langchain/core/prompts');
const crypto = require('crypto');
const { getCachedJobPosting, setCachedJobPosting } = require('./lib/cache');

const app = express();
const port = process.env.PORT || 8080;

// Initialize Secret Manager client
const secretClient = new SecretManagerServiceClient();

// LangChain components (initialized lazily)
// LangChain initialization removed
// Initialization logic for ChatModel and PromptTemplate deleted as it is no longer required.

/**
 * Scrape webpage using Jina AI Reader
 */
async function scrapeWebpage(url) {
  console.log('Starting Jina AI scrape for:', url);

  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl, {
      method: 'GET',
      headers: {
        // Optional: Add 'Authorization': 'Bearer <YOUR_KEY>' if you have one for higher limits
        'X-Target-Selector': 'body', // Optional: Focus on body
        'Accept': 'application/json' // Request JSON response to get metadata if needed, or text for raw markdown
      }
    });

    if (!response.ok) {
      throw new Error(`Jina AI request failed: ${response.status} ${response.statusText}`);
    }

    // Jina returns the markdown directly in the body
    const content = await response.text();

    console.log('Jina scrape successful, content length:', content.length);
    return content;
  } catch (error) {
    console.error('Jina scrape error:', error);
    throw error;
  }
}

/**
 * Extract job posting using LangChain
 */
// extractJobPosting function removed

/**
 * Validate URL format
 */
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main scraping endpoint
app.post('/scrape', async (req, res) => {
  console.log('Received POST request to /scrape');

  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL is required and must be a string'
      });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.'
      });
    }

    console.log('Processing URL:', url);

    try {
      // Check cache first
      const cachedData = await getCachedJobPosting(url);

      if (cachedData) {
        console.log('Cache HIT - returning cached job posting');
        return res.json({
          success: true,
          jobPosting: cachedData.jobPosting,
          urlHash: cachedData.urlHash,
          extractedAt: cachedData.extractedAt,
          fromCache: true
        });
      }

      // Cache MISS - scrape the webpage
      console.log('Cache MISS - performing fresh scrape');
      const scrapedContent = await scrapeWebpage(url);

      if (!scrapedContent || scrapedContent.trim().length < 100) {
        return res.status(400).json({
          success: false,
          error: 'Could not extract sufficient content from the webpage. The page might be protected or contain minimal text.'
        });
      }

      // OPTIMIZATION: Jina returns structured Markdown which the Analysis LLM can process directly.
      const extractedJobPosting = scrapedContent;

      if (extractedJobPosting.length < 50) {
        return res.status(400).json({
          success: false,
          error: 'The provided URL returned very little content. Please check the URL.'
        });
      }

      // Cache the result (720 hours = 30 days TTL)
      await setCachedJobPosting(url, extractedJobPosting, 720);

      const response = {
        success: true,
        jobPosting: extractedJobPosting,
        urlHash: generateUrlHash(url),
        extractedAt: new Date().toISOString(),
        fromCache: false
      };

      res.json(response);

    } catch (scrapeError) {
      console.error('Scraping error:', scrapeError);
      res.status(500).json({
        success: false,
        error: 'Failed to scrape webpage. The site might be protected, require authentication, or be temporarily unavailable.',
        details: scrapeError instanceof Error ? scrapeError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error processing scrape request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Scrape service listening on port ${port}`);
  console.log('Health check available at /health');
  console.log('Scraping endpoint available at /scrape');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});