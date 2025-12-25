const functions = require('@google-cloud/functions-framework');
const { getCacheStats } = require('./lib/cache');

/**
 * Main Cloud Function handler for cache statistics
 */
functions.http('cache-stats', async (req, res) => {
  console.log('Cache stats function called');

  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Get actual Redis cache statistics
    const stats = await getCacheStats();

    const response = {
      success: true,
      stats: {
        totalCachedJobs: stats.totalEntries || 0,
        memoryUsage: stats.memoryUsage || 'N/A',
        timestamp: new Date().toISOString()
      }
    };

    console.log('Returning cache stats:', response);
    res.json(response);

  } catch (error) {
    console.error('Error getting cache stats:', error);

    const errorResponse = {
      success: false,
      error: 'Failed to get cache statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    };

    res.status(500).json(errorResponse);
  }
});