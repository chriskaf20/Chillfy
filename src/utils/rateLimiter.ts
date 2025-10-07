import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (request: NextRequest) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Simple in-memory rate limiter
 * Note: In production, use Redis or a database for distributed rate limiting
 */
export class RateLimiter {
  private static instance: RateLimiter;
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  public async isAllowed(
    request: NextRequest,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remainingRequests: number; resetTime: number }> {
    const key = config.keyGenerator ? config.keyGenerator(request) : this.getDefaultKey(request);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let entry = this.store.get(key);

    // If no entry or window has expired, create new entry
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs
      };
      this.store.set(key, entry);
      
      return {
        allowed: true,
        remainingRequests: config.maxRequests - 1,
        resetTime: entry.resetTime
      };
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: entry.resetTime
      };
    }

    return {
      allowed: true,
      remainingRequests: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  private getDefaultKey(request: NextRequest): string {
    // Use IP address as default key
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    return `rate_limit:${ip}:${request.nextUrl.pathname}`;
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.store.forEach((entry, key) => {
      if (entry.resetTime <= now) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.store.delete(key));
  }

  public destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Pre-configured rate limiters for common scenarios
export const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 attempts per 15 minutes
};

export const apiRateLimit = {
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 60 // 60 requests per minute
};

export const strictRateLimit = {
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 10 // 10 requests per minute
};
