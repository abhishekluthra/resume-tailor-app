# Optimized Dockerfile for Jina AI scraping service
# Image size reduced from 2.92GB to ~200MB by removing Puppeteer/Chrome
FROM node:20-slim

# Install only essential dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r scraper && useradd -r -g scraper scraper

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY server.js ./
COPY lib/ ./lib/

# Change ownership to non-root user
RUN chown -R scraper:scraper /usr/src/app

# Switch to non-root user
USER scraper

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "server.js"]
