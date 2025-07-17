import { NextResponse } from 'next/server';
import { getCacheStats } from '@/utils/redis';
import { CacheStatsResponse } from '@/types/scraping';

// GET /api/cache/stats - Get cache statistics (for monitoring/debugging)
export async function GET(): Promise<NextResponse<CacheStatsResponse>> {
  try {
    const stats = await getCacheStats();
    
    const response: CacheStatsResponse = {
      success: true,
      stats: {
        totalCachedJobs: stats.totalEntries,
        memoryUsage: stats.memoryUsage || 'N/A',
        timestamp: new Date().toISOString()
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    
    const errorResponse: CacheStatsResponse = { 
      success: false, 
      error: 'Failed to get cache statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}