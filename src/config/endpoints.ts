// API Endpoint Configuration for AlignMyResume
// This file centralizes API endpoint management for easy environment switching

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isGcpMigration = process.env.NEXT_PUBLIC_USE_GCP === 'true';

// Debug logging (remove in production)
if (typeof window !== 'undefined') {
  console.log('[Endpoints] NEXT_PUBLIC_USE_GCP:', process.env.NEXT_PUBLIC_USE_GCP);
  console.log('[Endpoints] isGcpMigration:', isGcpMigration);
  console.log('[Endpoints] Using provider:', isGcpMigration ? 'GCP' : 'Vercel');
}

// Vercel API endpoints (current)
const VERCEL_ENDPOINTS = {
  analyze: '/api/analyze',
  scrape: '/api/scrape',
  insights: '/api/insights',
  cacheStats: '/api/cache/stats'
};

// GCP endpoints (Cloud Run services deployed in us-east1)
const GCP_ENDPOINTS = {
  analyze: 'https://analyze-672690422753.us-east1.run.app',
  scrape: 'https://scrape-service-672690422753.us-east1.run.app',
  insights: 'https://insights-ykuwv5z3zq-ue.a.run.app',
  cacheStats: 'https://cache-stats-ykuwv5z3zq-ue.a.run.app'
};

/**
 * Get the appropriate API endpoints based on environment configuration
 */
export function getApiEndpoints() {
  // During migration, use environment variable to switch
  if (isGcpMigration) {
    return GCP_ENDPOINTS;
  }
  
  // Default to Vercel endpoints
  return VERCEL_ENDPOINTS;
}

/**
 * Individual endpoint getters for convenience
 */
export const endpoints = {
  get analyze() { return getApiEndpoints().analyze; },
  get scrape() { return getApiEndpoints().scrape; },
  get insights() { return getApiEndpoints().insights; },
  get cacheStats() { return getApiEndpoints().cacheStats; }
};

/**
 * Migration helper - returns current configuration info
 */
export function getEndpointConfig() {
  return {
    isProduction,
    isGcpMigration,
    currentProvider: isGcpMigration ? 'GCP' : 'Vercel',
    endpoints: getApiEndpoints()
  };
}