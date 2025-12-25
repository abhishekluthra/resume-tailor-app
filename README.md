# AlignMyResume

AlignMyResume is a modern web application that helps job seekers align their resumes perfectly with specific job postings using AI-powered analysis. The application provides personalized recommendations and insights to improve resume effectiveness.

## Features

- 📝 **Resume Analysis**: Upload your resume in DOCX or TXT format (max 2MB)
- 🔗 **URL Scraping**: Paste job posting URLs - AI automatically extracts content
- 🔍 **Job Posting Analysis**: Compare your resume against specific job postings
- 🎯 **Personalized Recommendations**: Get actionable, categorized suggestions
- 📊 **Detailed Scoring**: Receive scores across multiple categories
- 💡 **AI-Powered Insights**: Market context, position analysis, and strategic advice
- ⚡ **Smart Caching**: 30-day Redis cache for faster repeat analyses (60-80% cost savings)
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ♿ **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation

## Tech Stack

### Frontend (Vercel)
- Next.js 15.3.3
- React 19
- TypeScript
- Tailwind CSS 4
- React Context API for state management

### Backend (GCP Cloud Run)
- **Scraping Service**: Node.js with Puppeteer + LangChain for intelligent content extraction
- **Analysis Service**: OpenAI GPT-4o-mini for resume analysis
- **Insights Service**: OpenAI GPT-4o-mini for strategic career insights
- **Cache Stats**: Redis monitoring and statistics

### Infrastructure
- **GCP Cloud Run**: Serverless container platform for backend services
- **Redis Memorystore**: 1GB cache for job postings and insights (30-day TTL)
- **Secret Manager**: Secure API key storage
- **VPC Network**: Private networking for Redis connectivity

### AI & Processing
- **OpenAI GPT-4o-mini**: Cost-optimized model for analysis and insights
- **LangChain**: Agentic AI framework for job posting extraction
- **Playwright**: Headless browser for web scraping
- **Mammoth.js**: DOCX file processing

## Prerequisites

### For Local Development
- Node.js 20+ (LTS recommended)
- npm or yarn
- OpenAI API key
- Redis (for local caching, optional)
  ```bash
  brew install redis  # macOS
  brew services start redis
  ```

### For GCP Deployment
- Google Cloud Platform account
- `gcloud` CLI configured
- Terraform (for infrastructure provisioning)
- Docker (for building container images)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/align-my-resume.git
   cd align-my-resume
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory:
   ```bash
   # OpenAI API key for AI analysis
   OPENAI_API_KEY=your_openai_api_key_here

   # Redis connection (optional, for local caching)
   REDIS_URL=redis://localhost:6379

   # Toggle GCP backend (set to 'true' to use GCP services)
   NEXT_PUBLIC_USE_GCP=false
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Choose Input Method**:
   - Toggle to "Use Job URL" to automatically scrape job postings
   - Or use "Paste Job Posting" to manually enter text

2. **Upload Resume**: Drop or select your resume (DOCX or TXT, max 2MB)

3. **Provide Job Details**:
   - For URL mode: Paste the job posting URL
   - For manual mode: Paste the full job description

4. **Analyze**: Click "Analyze Resume" and wait 10-30 seconds

5. **Review Results**:
   - **Job Analysis Tab**: View extracted requirements, responsibilities, and AI insights
   - **Recommendations Tab**: Get categorized, actionable improvement suggestions

6. **Apply Insights**: Use the recommendations to tailor your resume

## Project Structure

```
resume-tailor-app/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # Vercel API routes (fallback)
│   │   ├── results/      # Results page
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   ├── config/           # Configuration (endpoints, etc.)
│   ├── context/          # React context providers
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── gcp/                  # GCP backend services
│   ├── cloud-run/        # Cloud Run services
│   │   └── scrape/       # Scraping service with Puppeteer
│   ├── functions/        # Cloud Functions (Gen2)
│   │   ├── analyze/      # Resume analysis function
│   │   ├── insights/     # AI insights generation
│   │   └── cache-stats/  # Cache monitoring
│   ├── shared/           # Shared libraries
│   │   └── lib/cache.js  # Redis client wrapper
│   └── terraform/        # Infrastructure as Code
├── public/               # Static assets
└── ...config files
```

## Architecture

### Hybrid Cloud Architecture
AlignMyResume uses a selective microservices approach, splitting workloads between Vercel and GCP:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    USER                                         │
│                            (Browser / Mobile)                                   │
└────────────────────────────────┬────────────────────────────────────────────────┘
                                 │
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           VERCEL (Frontend)                                     │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  Next.js 15 App                                                          │  │
│  │  - React 19 UI Components                                                │  │
│  │  - Context API (State Management)                                        │  │
│  │  - Dynamic Endpoint Switching (NEXT_PUBLIC_USE_GCP)                      │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└────────┬──────────────┬──────────────┬──────────────┬──────────────────────────┘
         │              │              │              │
         │ POST /scrape │ POST         │ POST         │ GET
         │              │ /analyze     │ /insights    │ /cache-stats
         ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      GOOGLE CLOUD PLATFORM (Backend)                            │
│                                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │ Scrape Service│  │Analyze Service│  │Insights Service│  │ Cache Stats   │  │
│  │ (Cloud Run)   │  │(Cloud Function│  │(Cloud Function│  │(Cloud Function│  │
│  │               │  │     Gen2)     │  │     Gen2)     │  │     Gen2)     │  │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤  ├───────────────┤  │
│  │• Puppeteer    │  │• OpenAI API   │  │• OpenAI API   │  │• Redis Client │  │
│  │• LangChain    │  │• GPT-4o-mini  │  │• GPT-4o-mini  │  │• Stats API    │  │
│  │• Redis Cache  │  │• Resume Parse │  │• Redis Cache  │  │               │  │
│  │• 50s Timeout  │  │• Job Analysis │  │• AI Insights  │  │               │  │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  │
│          │                  │                  │                  │          │
│          │                  │                  │                  │          │
│          └──────────────────┴──────────────────┴──────────────────┘          │
│                                      │                                        │
│                         VPC Connector (alignmyresume-connector)               │
│                              10.9.0.0/28 (Private Network)                    │
│                                      │                                        │
│                                      ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │              Redis Memorystore (1GB BASIC)                              │ │
│  │              10.0.0.3:6379 (Private IP)                                 │ │
│  │                                                                         │ │
│  │  Cache Keys:                                                            │ │
│  │  • job_posting:<url_hash>  → Scraped job content (30-day TTL)          │ │
│  │  • insights:<analysis_hash> → AI insights (30-day TTL)                 │ │
│  │                                                                         │ │
│  │  Benefits: 60-80% cost savings through deduplication                   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                    Secret Manager                                       │  │
│  │  • openai-api-key (for all AI services)                                │  │
│  │  • redis-password (for Memorystore auth)                               │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘

External APIs:
    │
    └──► OpenAI GPT-4o-mini API (via HTTPS)
         - Resume analysis
         - Job posting extraction
         - Strategic insights generation

Request Flow Example (URL Scraping):
─────────────────────────────────────
1. User uploads resume + enters job URL
2. Frontend → Scrape Service (check Redis cache by URL hash)
3. Cache MISS → Puppeteer scrapes page → LangChain extracts job posting → Cache result
4. Frontend → Analyze Service (resume + job posting → OpenAI GPT-4o-mini)
5. Frontend → Insights Service (check Redis cache by analysis hash)
6. Cache MISS → Generate AI insights → Cache result
7. Frontend displays: Job Analysis + Recommendations + AI Insights

Cost Optimization:
──────────────────
• Redis caching: ~60-80% API cost reduction
• Cloud Run: Pay-per-request, auto-scaling (0-3 instances)
• GPT-4o-mini: Cost-optimized model vs GPT-4
• 30-day cache TTL: Balance freshness vs savings
• Projected monthly cost: ~$75-85 (under $100 budget)
```


**Frontend (Vercel)**:
- Next.js application with SSR and client-side routing
- Fast global CDN distribution
- Automatic deployments from `main` branch

**Backend (GCP Cloud Run)**:
- **Scrape Service**: Headless browser automation with Puppeteer for job posting extraction
- **Analysis Service**: GPT-4o-mini powered resume analysis against job requirements
- **Insights Service**: AI-generated strategic career insights and market context
- **Cache Stats**: Redis monitoring and statistics endpoint

**Caching Layer (Redis Memorystore)**:
- 1GB BASIC tier instance in us-east1
- 30-day TTL for job postings and insights
- Hash-based deduplication (SHA256 URL hashing)
- ~60-80% cost savings through intelligent caching

**Networking**:
- VPC Serverless Connector for private Redis access
- Secret Manager for secure API key storage
- Public HTTPS endpoints with CORS configuration

### Request Flow
1. User uploads resume and provides job URL/text
2. Frontend calls GCP scrape service (if URL mode)
3. Scrape service checks Redis cache → scrapes if cache miss → stores result
4. Frontend calls GCP analysis service with resume + job posting
5. Analysis service processes with OpenAI GPT-4o-mini
6. Frontend calls GCP insights service with job analysis data
7. Insights service checks cache → generates if cache miss → returns strategic insights
8. Results displayed in tabbed interface with recommendations and insights

## GCP Deployment

### Infrastructure Setup (One-time)
```bash
# Navigate to Terraform directory
cd gcp/terraform

# Initialize Terraform
terraform init

# Review planned changes
terraform plan -var="project_id=your-gcp-project" -var="region=us-east1"

# Apply infrastructure
terraform apply -var="project_id=your-gcp-project" -var="region=us-east1"

# Save outputs (Redis credentials, VPC connector info)
terraform output
```

### Deploy Backend Services
```bash
# Option 1: Deploy all services at once
cd gcp
chmod +x deploy.sh
./deploy.sh

# Option 2: Deploy individual services
cd gcp/cloud-run/scrape
gcloud run deploy scrape-service --source . --region us-east1

cd ../../functions/analyze
gcloud functions deploy analyze --gen2 --runtime nodejs20 --trigger-http --region us-east1

# Similar commands for insights and cache-stats functions
```

### Frontend Configuration
In Vercel dashboard, set environment variable:
```
NEXT_PUBLIC_USE_GCP=true
```

This toggles the frontend to call GCP backend services instead of Vercel API routes.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This application is currently in beta and under active development. Features may change and some functionality may be limited. The tool is designed for educational purposes and should be used as a guide rather than a definitive solution for resume alignment.

## Acknowledgments

- OpenAI for providing the GPT-4 API
- Next.js team for the amazing framework
- All contributors and users of the application
