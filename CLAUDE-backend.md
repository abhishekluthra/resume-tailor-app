# CLAUDE-backend.md - ResuMold Backend Context

## Backend Architecture Overview
ResuMold's backend leverages Next.js API routes with OpenAI GPT-4o-mini for AI-powered analysis, Redis for caching, and agentic AI with LangChain for web scraping.

## Directory Structure

### `/src/app/api/` - Next.js API Routes (4 endpoints)

#### **Core Analysis API**
- **`analyze/route.ts`** - Main resume analysis endpoint with job validation
  - **Input**: Resume file (DOCX/TXT) + job posting text
  - **Processing**: File parsing, AI analysis, structured response
  - **Output**: Analysis scores, recommendations, job breakdown
  - **Validation**: Job posting quality checks with error responses

#### **Web Scraping API**
- **`scrape/route.ts`** - URL-based job posting extraction with agentic AI
  - **Input**: Job posting URL
  - **Processing**: Puppeteer headless browsing, LangChain parsing
  - **Output**: Cleaned job posting text for analysis
  - **Features**: Hash-based caching, content validation

#### **AI Insights API**
- **`insights/route.ts`** - Strategic job market insights generation
  - **Input**: Job analysis data (skills, experience, responsibilities)
  - **Processing**: OpenAI GPT-4o-mini with specialized prompts
  - **Output**: Market context, position analysis, strategic advice (6 insights)
  - **Features**: Comprehensive logging, error handling, 30-day caching

#### **Cache Monitoring API**
- **`cache/stats/route.ts`** - Redis cache statistics for debugging
  - **Output**: Cache hit/miss rates, memory usage, total entries
  - **Purpose**: Development monitoring and performance optimization

### `/src/lib/` - Backend Utilities & Services

#### **Redis Cache Management**
- **`redis.ts`** - Centralized Redis operations
  - **Functions**: `getCachedJobPosting`, `setCachedJobPosting`, `getCacheStats`
  - **Features**: SHA256 URL hashing, automatic TTL management
  - **Privacy**: No actual URLs stored, only hashed keys

#### **AI Prompt Templates**  
- **`prompts.ts`** - OpenAI system prompts and templates
  - **Analysis Prompts**: Structured resume evaluation templates
  - **Validation Logic**: Job posting quality assessment
  - **Response Formatting**: Ensures consistent JSON structure

### `/src/types/` - Shared TypeScript Interfaces
Backend-relevant types for API contracts and data validation:
- **`resume-analysis.ts`** - Analysis result types, recommendation structures
- **`scraping.ts`** - Scraping API types, cache interfaces, error responses
- **`context.ts`** - Shared context types for frontend integration

## API Endpoints Deep Dive

### **POST `/api/analyze`**
**Primary Resume Analysis Endpoint**

**Request Format:**
```typescript
FormData: {
  resume: File,           // DOCX or TXT file (2MB max)
  jobPosting: string      // Job description text
}
```

**Process Flow:**
1. **File Parsing**: Mammoth.js for DOCX, Buffer.toString() for TXT
2. **Job Validation**: AI-powered assessment of job posting quality
3. **Analysis**: OpenAI GPT-4o-mini with structured prompts
4. **Response**: Categorized scores + 5 targeted recommendations

**Response Types:**
- **Valid Analysis**: `AnalysisResult` with scores and recommendations
- **Invalid Job**: `InvalidJobPostingError` with improvement suggestions

### **POST `/api/scrape`**
**Agentic Web Scraping for Job URLs**

**Request Format:**
```typescript
{ url: string }
```

**Process Flow:**
1. **Cache Check**: SHA256 URL hash lookup (4-hour TTL)
2. **Scraping**: Puppeteer headless browser automation
3. **Content Extraction**: Intelligent targeting of job-specific content
4. **AI Parsing**: LangChain + OpenAI for structured extraction
5. **Validation**: Content quality and completeness checks
6. **Caching**: Store parsed results with hash-based keys

**Features:**
- **Smart Caching**: 60-80% cost reduction for repeated URLs
- **Privacy-First**: Only URL hashes cached, content auto-expires
- **Error Handling**: Graceful fallbacks for protected sites

### **POST `/api/insights`**
**AI-Powered Strategic Job Insights**

**Request Format:**
```typescript
{ jobAnalysis: JobAnalysis }
```

**Process Flow:**
1. **Input Validation**: Verify job analysis structure
2. **Cache Check**: SHA256 hash of job data (30-day TTL)
3. **AI Generation**: OpenAI GPT-4o-mini with specialized insights prompt
4. **Structured Output**: 6 insights across 3 categories
5. **Response Formatting**: JSON with category icons and titles

**Insight Categories:**
- **Market Context** (2 insights): Salary ranges, industry trends
- **Position Analysis** (2 insights): Seniority level, growth potential
- **Strategic Advice** (2 insights): Critical skills, optimization tips

### **GET `/api/cache/stats`**
**Development & Monitoring Endpoint**

**Response:**
```typescript
{
  success: boolean,
  stats: {
    totalCachedJobs: number,
    memoryUsage: string,
    timestamp: string
  }
}
```

## Technology Stack & Dependencies

### **AI & LLM Integration**
- **OpenAI GPT-4o-mini**: Cost-effective model for analysis and insights
- **LangChain**: Agentic AI framework for scraping workflows
- **Structured Outputs**: JSON mode for consistent API responses

### **Web Scraping Stack**
- **Puppeteer Core**: Headless browser automation
- **@sparticuz/chromium**: Vercel-compatible Chromium binary
- **Content Processing**: Intelligent extraction targeting job postings

### **Data Processing**
- **Mammoth.js**: DOCX text extraction
- **Native Buffer**: TXT file processing
- **Crypto**: SHA256 hashing for privacy-compliant caching

### **Caching & Performance**
- **Redis**: In-memory caching with TTL management
- **Hash-based Keys**: Privacy-compliant caching strategy
- **Multiple TTL Strategies**: 4 hours (scraping), 30 days (insights)

## Environment Variables & Configuration

### **Required Environment Variables**
```bash
OPENAI_API_KEY=sk-...           # OpenAI API access
REDIS_URL=redis://localhost:6379  # Redis connection
```

### **Development Environment**
```bash
# Local Redis setup
brew install redis
brew services start redis

# Environment file
cp .env.example .env.local
# Add OPENAI_API_KEY and REDIS_URL
```

## Error Handling & Monitoring

### **Comprehensive Logging**
- **Request IDs**: Unique identifiers for debugging
- **Performance Metrics**: API call timing and response sizes
- **Error Context**: Stack traces with request details
- **Cache Operations**: Hit/miss logging with performance data

### **Error Response Patterns**
```typescript
// Validation errors
{ error: "Job analysis data is required", status: 400 }

// Processing errors  
{ error: "Failed to generate insights. Please try again.", status: 500 }

// Detailed debugging
{ error: "...", details: "specific error message", status: 500 }
```

## Performance & Cost Optimization

### **Caching Strategy**
- **URL Scraping**: 4-hour TTL, 60-80% cost reduction
- **AI Insights**: 30-day TTL based on job analysis hash
- **Privacy Compliant**: Only SHA256 hashes stored, auto-expiring content

### **Resource Management**
- **Puppeteer**: Headless browser optimization for Vercel
- **OpenAI**: Temperature and token limits for consistent responses
- **Redis**: Memory usage monitoring and automatic cleanup

### **Scalability Projections**
- **5K users**: ~$200-400/month with intelligent caching
- **10K users**: ~$400-800/month
- **Cost optimization**: 60-80% savings through cache hits

## Security & Privacy

### **Data Handling**
- **No Persistent Storage**: Resume data never saved to disk
- **Hash-based Caching**: URLs converted to SHA256, content auto-expires
- **API Key Security**: Environment-based secret management

### **Input Validation**
- **File Size Limits**: 2MB maximum upload size
- **File Type Validation**: DOCX and TXT only
- **Content Sanitization**: Secure parsing of user inputs

## Future Backend Enhancements (Phase 3 Roadmap)

### **Multi-Agent Architecture**
- **Scraper Agent**: Site-specific extraction strategies
- **Parser Agent**: Advanced job posting analysis
- **Validator Agent**: Content quality assessment
- **Orchestrator**: Agent workflow coordination

### **Enhanced Job Board Support**
- **LinkedIn Jobs**: Specialized parsing logic
- **Indeed**: Anti-bot circumvention strategies
- **Company Career Pages**: Custom extraction patterns

### **Microservices Migration (Phase 4)**
- **GCP Cloud Run**: Isolated scraping service deployment
- **Service Communication**: API contracts between services
- **Independent Scaling**: Resource optimization by service

## Development Workflows

### **API Development**
1. Create route in `/src/app/api/[endpoint]/route.ts`
2. Define TypeScript interfaces in `/src/types/`
3. Implement business logic in `/src/lib/`
4. Add comprehensive error handling and logging
5. Test with real data and edge cases

### **AI Integration**
1. Design prompts in `/src/lib/prompts.ts`
2. Test prompt effectiveness with various inputs
3. Implement structured output validation
4. Add caching for cost optimization
5. Monitor token usage and response quality

### **Cache Management**
1. Design hash strategy for data uniqueness
2. Set appropriate TTL based on use case
3. Implement fallback for cache failures
4. Add monitoring and statistics tracking
5. Test cache invalidation scenarios