const express = require('express');
const cors = require('cors');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const puppeteer = require('puppeteer');
const { ChatOpenAI } = require('@langchain/openai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const crypto = require('crypto');
const { getCachedJobPosting, setCachedJobPosting } = require('./lib/cache');

const app = express();
const port = process.env.PORT || 8080;

// Initialize Secret Manager client
const secretClient = new SecretManagerServiceClient();

// LangChain components (initialized lazily)
let chatModel = null;
let jobExtractionPrompt = null;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '10mb' }));

// Inlined utility functions (from shared package)
function generateUrlHash(url) {
  return crypto.createHash('sha256').update(url.toLowerCase().trim()).digest('hex');
}

// Create a prompt template for job posting extraction
const jobExtractionPromptTemplate = ChatPromptTemplate.fromTemplate(`
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

/**
 * Initialize LangChain components with OpenAI API key from Secret Manager
 */
async function initializeLangChain() {
  if (!chatModel) {
    try {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'nurel-app-dev';
      const secretName = `projects/${projectId}/secrets/openai-api-key/versions/latest`;
      
      const [version] = await secretClient.accessSecretVersion({
        name: secretName,
      });
      
      const apiKey = version.payload.data.toString();
      
      chatModel = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0.1,
        openAIApiKey: apiKey,
      });
      
      jobExtractionPrompt = jobExtractionPromptTemplate;
      
      console.log('LangChain initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LangChain:', error);
      throw new Error('LangChain configuration error');
    }
  }
  return { chatModel, jobExtractionPrompt };
}

/**
 * Scrape webpage content using Puppeteer
 */
async function scrapeWebpage(url) {
  console.log('Starting webpage scrape for:', url);
  
  // Determine Chrome executable path based on what's available
  const chromePaths = [
    '/usr/bin/google-chrome-stable',  // Google Chrome (amd64)
    '/usr/bin/chromium',              // Chromium (ARM64 fallback)
    '/usr/bin/chromium-browser'       // Alternative Chromium path
  ];
  
  let executablePath = null;
  for (const path of chromePaths) {
    try {
      await require('fs').promises.access(path);
      executablePath = path;
      console.log('Using Chrome executable:', executablePath);
      break;
    } catch (e) {
      // Path doesn't exist, try next
    }
  }
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080'
    ],
    executablePath: executablePath || undefined // Let Puppeteer find Chrome if paths fail
  });
  
  try {
    const page = await browser.newPage();
    
    // Set user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to page with increased timeout for complex job boards
    await page.goto(url, {
      waitUntil: 'networkidle2',  // Wait until network is mostly idle
      timeout: 50000  // Increased to 50s (Cloud Run allows 60s total)
    });

    // Additional wait for dynamic content (reduced since networkidle2 waits longer)
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

/**
 * Extract job posting using LangChain
 */
async function extractJobPosting(content) {
  console.log('Extracting job posting with AI, content length:', content.length);
  
  // Truncate content if too long to avoid token limits
  const truncatedContent = content.length > 10000 
    ? content.substring(0, 10000) + '...'
    : content;
  
  const { chatModel: model, jobExtractionPrompt: prompt } = await initializeLangChain();
  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    content: truncatedContent,
  });
  
  console.log('AI extraction result length:', result.length);
  return result;
}

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

      // Extract job posting using AI
      const extractedJobPosting = await extractJobPosting(scrapedContent);

      if (extractedJobPosting.includes('INVALID_JOB_POSTING')) {
        return res.status(400).json({
          success: false,
          error: 'The provided URL does not appear to contain a valid job posting. Please check the URL and try again.'
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