# GCP Backend Infrastructure

This directory contains the Google Cloud Platform infrastructure and service configurations for the AlignMyResume backend migration.

## Directory Structure

```
gcp/
├── functions/          # Cloud Functions implementations
│   ├── analyze/        # Resume analysis function
│   ├── insights/       # AI insights generation function
│   └── cache-stats/    # Cache statistics function
├── cloud-run/          # Cloud Run services
│   └── scrape/         # Web scraping service container
├── shared/             # Shared utilities and libraries
│   └── lib/            # Common code used across services
├── terraform/          # Infrastructure as Code
│   ├── main.tf         # Main Terraform configuration
│   ├── variables.tf    # Variable definitions
│   └── outputs.tf      # Output values
└── cloudbuild.yaml     # CI/CD pipeline configuration
```

## Project Configuration

- **Project ID:** nurel-app-dev
- **Region:** us-east1
- **Node.js Runtime:** 20
- **Architecture:** Serverless (Cloud Functions + Cloud Run)

## Services Overview

### Cloud Functions
- **analyze** - Resume analysis with OpenAI + file processing (512MB, 15s timeout)
- **insights** - AI insights generation with caching (512MB, 15s timeout)  
- **cache-stats** - Cache monitoring and statistics (512MB, 15s timeout)

### Cloud Run
- **scrape** - Web scraping with Puppeteer + LangChain (2GB, 30s timeout)

### Data Layer
- **Memorystore (Redis)** - Hot cache for job postings and insights
- **Firestore** - Structured data for analytics and future extensibility

## Environment Variables

All environment variables are managed through Google Secret Manager:
- `OPENAI_API_KEY` - OpenAI API access key
- `REDIS_URL` - Memorystore Redis connection string

## Deployment

Services are deployed using Google Cloud Build with automated CI/CD pipeline.
Infrastructure is managed through Terraform for consistency and version control.

## Local Debugging (scrape-service)

Use the existing `scrape_service_local` Docker image to reproduce Cloud Run startup issues before redeploying:

1. Create a `.env.scrape.local` file with required secrets:
   ```
   OPENAI_API_KEY=sk-...
   GOOGLE_CLOUD_PROJECT=nurel-app-dev
   REDIS_URL=redis://localhost:6379  # optional for cache tests
   ```
2. Run the container locally:
   ```bash
   docker run --rm -it \
     --env-file .env.scrape.local \
     -p 8080:8080 \
     scrape_service_local
   ```
3. Verify health and scraping endpoints:
   ```bash
   curl http://localhost:8080/health
   curl -X POST http://localhost:8080/scrape \
     -H "Content-Type: application/json" \
     -d '{"url":"https://example.com/job-posting"}'
   ```

Capture module-loading or Puppeteer errors from the local run to inform Cloud Run fixes before rebuilding the production image.

## Cloud Function Access Checklist

1. Confirm unauthenticated invoke is allowed:
   ```bash
   gcloud functions describe analyze --region=us-east1 --format='value(httpsTrigger.securityLevel)'
   ```
2. Grant public invoker if missing (repeat for each function):
   ```bash
   gcloud functions add-iam-policy-binding analyze \
     --region=us-east1 \
     --member='allUsers' \
     --role='roles/cloudfunctions.invoker'
   ```
3. Test HTTPS invocation from local machine to verify 200/400 responses:
   ```bash
   curl -i https://analyze-<project-id>.us-east1.run.app --request POST --data '{}'
   ```
4. If a 403 persists, inspect org policies blocking public access:
   ```bash
   gcloud org-policies list --constraint=constraints/compute.disableGuestAttributesAccess
   ```
   Request policy exemptions or create an API Gateway as needed.

## Cloud Run scrape-service Troubleshooting

1. Review startup logs for module errors:
   ```bash
   gcloud run services logs read scrape-service --region=us-east1 --limit=100
   ```
2. Compare with local container output using `scrape_service_local`; ensure `npm ci --omit=dev` installs `@langchain/*`, `puppeteer`, and peer dependencies.
3. If a module is missing, add it to `gcp/cloud-run/scrape/package.json` and rebuild the image:
   ```bash
   docker build -t scrape_service_local gcp/cloud-run/scrape
   ```
4. Validate Chrome availability inside the container:
   ```bash
   docker run --rm scrape_service_local which google-chrome-stable
   ```
   Adjust the Dockerfile if binaries differ between amd64 and arm64.
5. After fixes, redeploy and confirm `/health` returns 200 on Cloud Run:
   ```bash
   gcloud run deploy scrape-service --image=gcr.io/$PROJECT_ID/scrape-service:latest --region=us-east1
   curl https://scrape-service-<project-id>.us-east1.run.app/health
   ```

## Post-Migration Smoke Tests

Execute these checks after redeploying to confirm parity with Vercel:

1. Analyze endpoint:
   ```bash
   curl -X POST $ANALYZE_URL \
        -F 'resume=@test-resume.txt;type=text/plain' \
        -F 'jobPosting=$(cat test-job.txt)'
   ```
2. Scrape endpoint (URL mode):
   ```bash
   curl -X POST $SCRAPE_URL/scrape \
     -H 'Content-Type: application/json' \
     -d '{"url":"https://example.com/job"}'
   ```
3. Insights endpoint:
   ```bash
   curl -X POST $INSIGHTS_URL \
     -H 'Content-Type: application/json' \
     -d @fixtures/job-analysis.json
   ```
4. Cache stats endpoint:
   ```bash
   curl $CACHE_STATS_URL
   ```
5. Record results (status codes, latencies, cache hits) in `sdd/status/debug-gcp-environment.status.md` and flag discrepancies before switching traffic.

