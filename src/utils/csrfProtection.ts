import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_SECRET_COOKIE = 'csrf-secret';
const TOKEN_EXPIRY_MS = 3600000; // 1 hour

interface CSRFConfig {
  excludePaths?: string[];
  methods?: string[];
  secretLength?: number;
  tokenLength?: number;
}

export class CSRFProtection {
  private config: Required<CSRFConfig>;

  constructor(config: CSRFConfig = {}) {
    this.config = {
      excludePaths: config.excludePaths || ['/api/auth', '/api/health'],
      methods: config.methods || ['POST', 'PUT', 'PATCH', 'DELETE'],
      secretLength: config.secretLength || 32,
      tokenLength: config.tokenLength || 32
    };
  }

  /**
   * Generate a cryptographically secure random token
   */
  private generateSecureToken(length: number): string {
    return randomBytes(length).toString('base64url');
  }

  /**
   * Create CSRF token using HMAC-based approach
   */
  private createToken(secret: string): { token: string; expires: number } {
    const timestamp = Date.now();
    const expires = timestamp + TOKEN_EXPIRY_MS;
    
    // Create payload: timestamp|random
    const randomPart = this.generateSecureToken(16);
    const payload = `${timestamp}|${randomPart}`;
    
    // Create HMAC signature
    const hash = createHash('sha256');
    hash.update(secret + payload);
    const signature = hash.digest('base64url');
    
    // Final token: payload.signature
    const token = `${Buffer.from(payload).toString('base64url')}.${signature}`;
    
    return { token, expires };
  }

  /**
   * Verify CSRF token
   */
  private verifyToken(token: string, secret: string): boolean {
    try {
      const [payloadB64, signature] = token.split('.');
      if (!payloadB64 || !signature) {
        return false;
      }

      const payload = Buffer.from(payloadB64, 'base64url').toString();
      const [timestampStr, randomPart] = payload.split('|');
      
      if (!timestampStr || !randomPart) {
        return false;
      }

      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp) || Date.now() - timestamp > TOKEN_EXPIRY_MS) {
        return false;
      }

      // Verify signature
      const hash = createHash('sha256');
      hash.update(secret + payload);
      const expectedSignature = hash.digest('base64url');

      // Use timing-safe comparison
      const sigBuffer = Buffer.from(signature, 'base64url');
      const expectedBuffer = Buffer.from(expectedSignature, 'base64url');

      return sigBuffer.length === expectedBuffer.length && 
             timingSafeEqual(sigBuffer, expectedBuffer);

    } catch (error) {
      console.error('CSRF token verification error:', error);
      return false;
    }
  }

  /**
   * Check if path should be excluded from CSRF protection
   */
  private isExcludedPath(pathname: string): boolean {
    return this.config.excludePaths.some(path => 
      pathname.startsWith(path)
    );
  }

  /**
   * Check if method requires CSRF protection
   */
  private requiresCSRFProtection(method: string): boolean {
    return this.config.methods.includes(method.toUpperCase());
  }

  /**
   * Generate new CSRF token and secret
   */
  public generateTokens(): { token: string; secret: string; expires: number } {
    const secret = this.generateSecureToken(this.config.secretLength);
    const { token, expires } = this.createToken(secret);
    
    return { token, secret, expires };
  }

  /**
   * Set CSRF tokens in response cookies
   */
  public setTokenCookies(
    response: NextResponse, 
    tokens: { token: string; secret: string; expires: number }
  ): void {
    const cookieOptions = {
      httpOnly: false, // Token needs to be accessible to client-side JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: TOKEN_EXPIRY_MS / 1000, // Convert to seconds
      path: '/'
    };

    const secretOptions = {
      ...cookieOptions,
      httpOnly: true // Secret should be HTTP-only
    };

    response.cookies.set(CSRF_TOKEN_COOKIE, tokens.token, cookieOptions);
    response.cookies.set(CSRF_SECRET_COOKIE, tokens.secret, secretOptions);
  }

  /**
   * Validate CSRF token from request
   */
  public validateRequest(request: NextRequest): {
    valid: boolean;
    error?: string;
    shouldRegenerateToken?: boolean;
  } {
    const { pathname } = request.nextUrl;
    const method = request.method;

    // Skip validation for excluded paths
    if (this.isExcludedPath(pathname)) {
      return { valid: true };
    }

    // Skip validation for methods that don't require CSRF protection
    if (!this.requiresCSRFProtection(method)) {
      return { valid: true };
    }

    // Get tokens from request
    const tokenFromHeader = request.headers.get(CSRF_TOKEN_HEADER);
    const tokenFromCookie = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
    const secret = request.cookies.get(CSRF_SECRET_COOKIE)?.value;

    // Check if tokens exist
    if (!tokenFromHeader && !tokenFromCookie) {
      return { 
        valid: false, 
        error: 'CSRF token missing',
        shouldRegenerateToken: true 
      };
    }

    if (!secret) {
      return { 
        valid: false, 
        error: 'CSRF secret missing',
        shouldRegenerateToken: true 
      };
    }

    // Use header token if available, otherwise cookie token
    const token = tokenFromHeader || tokenFromCookie;
    if (!token) {
      return { 
        valid: false, 
        error: 'CSRF token not provided',
        shouldRegenerateToken: true 
      };
    }

    // Verify token
    const isValid = this.verifyToken(token, secret);
    
    if (!isValid) {
      return { 
        valid: false, 
        error: 'Invalid CSRF token',
        shouldRegenerateToken: true 
      };
    }

    return { valid: true };
  }

  /**
   * Middleware function for Next.js
   */
  public middleware() {
    return (request: NextRequest) => {
      const validation = this.validateRequest(request);

      if (!validation.valid) {
        console.warn(`🛡️ CSRF Protection: ${validation.error} for ${request.method} ${request.nextUrl.pathname}`);
        
        return NextResponse.json(
          { 
            error: 'CSRF token validation failed',
            code: 'CSRF_TOKEN_INVALID',
            message: validation.error 
          },
          { status: 403 }
        );
      }

      const response = NextResponse.next();

      // Regenerate tokens if needed (e.g., first request or expired tokens)
      if (validation.shouldRegenerateToken || !request.cookies.get(CSRF_TOKEN_COOKIE)) {
        const tokens = this.generateTokens();
        this.setTokenCookies(response, tokens);
      }

      return response;
    };
  }
}

// Utility function to get CSRF token on client side
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Try to get token from cookie
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_TOKEN_COOKIE) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

// Enhanced fetch wrapper with CSRF protection
export async function securedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const csrfToken = getCSRFToken();
  
  const headers = new Headers(options.headers);
  
  if (csrfToken) {
    headers.set(CSRF_TOKEN_HEADER, csrfToken);
  }

  // Ensure Content-Type for JSON requests
  if (options.body && typeof options.body === 'string') {
    if (!headers.get('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  const enhancedOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'same-origin' // Ensure cookies are sent
  };

  const response = await fetch(url, enhancedOptions);

  // If we get a CSRF error, try to refresh the token and retry once
  if (response.status === 403) {
    try {
      const errorData = await response.clone().json();
      if (errorData.code === 'CSRF_TOKEN_INVALID') {
        console.warn('🛡️ CSRF token invalid, attempting to refresh...');
        
        // Make a GET request to refresh the token
        await fetch('/api/csrf-token', { credentials: 'same-origin' });
        
        // Retry the original request with new token
        const newToken = getCSRFToken();
        if (newToken) {
          headers.set(CSRF_TOKEN_HEADER, newToken);
          return fetch(url, { ...enhancedOptions, headers });
        }
      }
    } catch (parseError) {
      // If we can't parse the error, just return the original response
      console.warn('Could not parse CSRF error response:', parseError);
    }
  }

  return response;
}

// Default CSRF protection instance
export const csrfProtection = new CSRFProtection({
  excludePaths: [
    '/api/auth',
    '/api/health',
    '/api/csrf-token',
    '/_next',
    '/favicon.ico'
  ]
});
