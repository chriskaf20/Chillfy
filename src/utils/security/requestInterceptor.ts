import { SecurityLogger } from './securityLogger';

export class RequestInterceptor {
  private trustedOrigins = [
    'https://your-production-url.com',
    'https://your-supabase-url.supabase.co',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
  ];
  private isDevelopment = process.env.NODE_ENV === 'development';
  private securityLogger: SecurityLogger;

  constructor(securityLogger: SecurityLogger) {
    this.securityLogger = securityLogger;
  }

  enableRequestInterception(): void {
    if (this.isDevelopment) return;

    this.interceptXMLHttpRequests();
    this.interceptFetchRequests();
  }

  private interceptXMLHttpRequests(): void {
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (data) {
      const url = (this as any).responseURL || '';
      // @ts-expect-error
      if (!this.isRequestValid(url, data)) {
        // @ts-expect-error
        this.blockSuspiciousRequest(url, data);
        return;
      }
      return originalSend.call(this, data);
    };
  }

  private interceptFetchRequests(): void {
    const originalFetch = window.fetch;
    window.fetch = (url, options = {}) => {
      if (!this.isRequestValid(url.toString(), options?.['body'])) {
        this.blockSuspiciousRequest(url.toString(), options?.['body']);
        return Promise.reject(new Error('Request blocked by security policy'));
      }
      return originalFetch.apply(this, [url, options]);
    };
  }

  isRequestValid(url: string, data: any): boolean {
    if (this.isDevelopment) return true;

    try {
      const urlObj = new URL(url, window.location.origin);
      return this.trustedOrigins.some(
        origin =>
          urlObj.origin === origin ||
          url.startsWith(origin) ||
          url.startsWith('/')
      );
    } catch (error) {
      return true;
    }
  }

  private blockSuspiciousRequest(url: string, data: any): void {
    if (this.isDevelopment) return;
    this.securityLogger.logSecurityThreat('request_blocked', { url, data });
  }
}