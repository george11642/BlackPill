import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitRedis } from '@/lib/redis/client';

// Internal API route for distributed rate limiting via Redis
// This is called by the middleware to check rate limits

export async function POST(request: NextRequest) {
  try {
    const { key, max, windowMs } = await request.json();
    
    if (!key || !max || !windowMs) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const result = await checkRateLimitRedis(key, max, windowMs);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Rate limit API error:', error);
    
    // Return success on error to avoid blocking legitimate requests
    return NextResponse.json({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    });
  }
}

