// src/lib/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export type ApiHandler<T = any> = (
  req: NextRequest,
  context: { params?: any }
) => Promise<NextResponse<T>>;

export interface ApiConfig {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  rateLimit?: {
    requests: number;
    window: number; // in seconds
  };
  validation?: {
    body?: z.ZodSchema;
    query?: z.ZodSchema;
  };
}

export function withApi<T = any>(
  handler: ApiHandler<T>,
  config: ApiConfig = {}
) {
  return async (req: NextRequest, context: { params?: any }) => {
    try {
      // Rate limiting (disabled for now)
      // if (config.rateLimit) {
      //   const rateLimitResult = await rateLimit(
      //     req,
      //     config.rateLimit.requests,
      //     config.rateLimit.window
      //   );
      //   if (rateLimitResult.isLimited) {
      //     return NextResponse.json(
      //       { error: 'Rate limit exceeded' },
      //       { 
      //         status: 429,
      //         headers: {
      //           'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      //           'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
      //         }
      //       }
      //     );
      //   }
      // }

      // Authentication
      if (config.requireAuth || config.requireAdmin) {
        // Add auth validation logic here
      }

      // Validation
      if (config.validation?.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        try {
          const body = await req.json();
          config.validation.body.parse(body);
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid request body', details: error },
            { status: 400 }
          );
        }
      }

      if (config.validation?.query) {
        const url = new URL(req.url);
        const query = Object.fromEntries(url.searchParams.entries());
        try {
          config.validation.query.parse(query);
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid query parameters', details: error },
            { status: 400 }
          );
        }
      }

      return await handler(req, context);
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
