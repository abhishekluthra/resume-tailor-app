#!/bin/bash

# AlignMyResume GCP Deployment Script
# This script deploys the backend infrastructure and services to GCP

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="nurel-app-dev"
REGION="us-east1"
ZONE="us-east1-b"

echo -e "${BLUE}🚀 Starting AlignMyResume GCP deployment...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed. Please install it first.${NC}"
    exit 1
fi

# Set project
echo -e "${BLUE}📋 Setting GCP project: ${PROJECT_ID}${NC}"
gcloud config set project $PROJECT_ID

# Deploy infrastructure with Terraform
echo -e "${BLUE}🏗️ Deploying infrastructure with Terraform...${NC}"
cd terraform

# Initialize Terraform
terraform init

# Plan deployment
echo -e "${YELLOW}📊 Planning Terraform deployment...${NC}"
terraform plan -var="project_id=${PROJECT_ID}" -var="region=${REGION}" -var="zone=${ZONE}"

# Ask for confirmation
echo -e "${YELLOW}⚠️  Do you want to apply these changes? (y/N)${NC}"
read -r response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
    echo -e "${RED}❌ Deployment cancelled.${NC}"
    exit 0
fi

# Apply infrastructure
echo -e "${BLUE}🔨 Applying Terraform configuration...${NC}"
terraform apply -var="project_id=${PROJECT_ID}" -var="region=${REGION}" -var="zone=${ZONE}" -auto-approve

# Get outputs
REDIS_HOST=$(terraform output -raw redis_host)
REDIS_PORT=$(terraform output -raw redis_port)
SERVICE_ACCOUNT=$(terraform output -raw service_account_email)

echo -e "${GREEN}✅ Infrastructure deployed successfully!${NC}"
echo -e "${BLUE}📊 Infrastructure details:${NC}"
echo -e "  Redis Host: ${REDIS_HOST}"
echo -e "  Redis Port: ${REDIS_PORT}"
echo -e "  Service Account: ${SERVICE_ACCOUNT}"

cd ..

# Check if OpenAI API key is set in Secret Manager
echo -e "${BLUE}🔑 Checking OpenAI API key in Secret Manager...${NC}"
if ! gcloud secrets describe openai-api-key --quiet &> /dev/null; then
    echo -e "${YELLOW}⚠️  OpenAI API key not found in Secret Manager.${NC}"
    echo -e "${YELLOW}Please set your OpenAI API key:${NC}"
    echo "gcloud secrets create openai-api-key --data-file=- <<< 'your-api-key-here'"
    exit 1
fi

# Build shared utilities
echo -e "${BLUE}📦 Building shared utilities...${NC}"
cd shared
npm ci
cd ..

# Deploy Cloud Functions
echo -e "${BLUE}☁️ Deploying Cloud Functions...${NC}"

# Deploy analyze function
echo -e "${BLUE}  📊 Deploying analyze function...${NC}"
cd functions/analyze
npm ci
gcloud functions deploy analyze \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --memory 512MB \
    --timeout 15s \
    --region $REGION \
    --service-account $SERVICE_ACCOUNT \
    --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID,REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"

echo -e "${GREEN}✅ Analyze function deployed${NC}"
cd ../..

# Deploy insights function
echo -e "${BLUE}  🧠 Deploying insights function...${NC}"
cd functions/insights
npm ci
gcloud functions deploy insights \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --memory 512MB \
    --timeout 15s \
    --region $REGION \
    --service-account $SERVICE_ACCOUNT \
    --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID,REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"

echo -e "${GREEN}✅ Insights function deployed${NC}"
cd ../..

# Deploy cache-stats function
echo -e "${BLUE}  📈 Deploying cache-stats function...${NC}"
cd functions/cache-stats
npm ci
gcloud functions deploy cache-stats \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --memory 512MB \
    --timeout 15s \
    --region $REGION \
    --service-account $SERVICE_ACCOUNT \
    --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID,REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"

echo -e "${GREEN}✅ Cache-stats function deployed${NC}"
cd ../..

# Deploy Cloud Run service
echo -e "${BLUE}🐳 Deploying Cloud Run scrape service...${NC}"
cd cloud-run/scrape

gcloud run deploy scrape-service \
    --source . \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --timeout 30s \
    --max-instances 10 \
    --service-account $SERVICE_ACCOUNT \
    --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID,REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"

echo -e "${GREEN}✅ Scrape service deployed${NC}"
cd ../..

# Get function URLs
echo -e "${BLUE}🔗 Getting service URLs...${NC}"
ANALYZE_URL=$(gcloud functions describe analyze --region=$REGION --format="value(httpsTrigger.url)")
INSIGHTS_URL=$(gcloud functions describe insights --region=$REGION --format="value(httpsTrigger.url)")
CACHE_STATS_URL=$(gcloud functions describe cache-stats --region=$REGION --format="value(httpsTrigger.url)")
SCRAPE_URL=$(gcloud run services describe scrape-service --region=$REGION --format="value(status.url)")

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📋 Service URLs:${NC}"
echo -e "  Analyze Function: ${ANALYZE_URL}"
echo -e "  Insights Function: ${INSIGHTS_URL}"
echo -e "  Cache Stats Function: ${CACHE_STATS_URL}"
echo -e "  Scrape Service: ${SCRAPE_URL}"

echo -e "${YELLOW}🔧 Next Steps:${NC}"
echo -e "1. Update your frontend environment variables to use these URLs"
echo -e "2. Test the endpoints to ensure they're working correctly"
echo -e "3. Monitor the services in the GCP Console"

echo -e "${BLUE}💰 Cost Monitoring:${NC}"
echo -e "Monitor your costs at: https://console.cloud.google.com/billing"