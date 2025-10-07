/**
 * Production Monitoring and Analytics System
 * Tracks performance, errors, user interactions, and business metrics
 */

interface MonitoringConfig {
  enableErrorTracking: boolean;
  enablePerformanceTracking: boolean;
  enableUserTracking: boolean;
  enableBusinessMetrics: boolean;
  sampleRate: number;
  environment: 'development' | 'staging' | 'production';
}

interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  context: {
    url: string;
    userAgent: string;
    userId?: string;
    sessionId: string;
    component?: string;
    action?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint: string;
}

interface PerformanceMetric {
  id: string;
  timestamp: string;
  metric: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  context: {
    page: string;
    userAgent: string;
    connection?: string;
  };
}

interface UserEvent {
  id: string;
  timestamp: string;
  event: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId: string;
  page: string;
}

interface BusinessMetric {
  id: string;
  timestamp: string;
  metric: string;
  value: number;
  dimensions: Record<string, string>;
}

class ProductionMonitor {
  private config: MonitoringConfig;
  private sessionId: string;
  private errorQueue: ErrorReport[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private userEventQueue: UserEvent[] = [];
  private businessMetricQueue: BusinessMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableErrorTracking: true,
      enablePerformanceTracking: true,
      enableUserTracking: true,
      enableBusinessMetrics: true,
      sampleRate: 1.0,
      environment: (process.env.NODE_ENV as any) || 'development',
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return;

    // Start periodic flush
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 10000); // Flush every 10 seconds

    // Setup error tracking
    if (this.config.enableErrorTracking) {
      this.setupErrorTracking();
    }

    // Setup performance tracking
    if (this.config.enablePerformanceTracking) {
      this.setupPerformanceTracking();
    }

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Flush on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  private setupErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        name: event.error?.name || 'Error'
      }, {
        component: 'global',
        action: 'unhandled_error'
      }, 'high');
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        name: 'UnhandledPromiseRejection'
      }, {
        component: 'promise',
        action: 'unhandled_rejection'
      }, 'high');
    });

    // Console error override
    const originalError = console.error;
    console.error = (...args) => {
      this.reportError({
        message: args.join(' '),
        name: 'ConsoleError'
      }, {
        component: 'console',
        action: 'error_log'
      }, 'medium');
      originalError.apply(console, args);
    };
  }

  private setupPerformanceTracking() {
    // Core Web Vitals
    this.trackWebVitals();

    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.trackNavigationTiming();
      }, 0);
    });

    // Resource timing
    this.trackResourceTiming();
  }

  private trackWebVitals() {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.reportPerformanceMetric('fcp', entry.startTime, 'ms');
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.reportPerformanceMetric('lcp', lastEntry.startTime, 'ms');
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        this.reportPerformanceMetric('fid', fid, 'ms');
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.reportPerformanceMetric('cls', clsValue, 'count');
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private trackNavigationTiming() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      this.reportPerformanceMetric('dns_lookup', navigation.domainLookupEnd - navigation.domainLookupStart, 'ms');
      this.reportPerformanceMetric('tcp_connect', navigation.connectEnd - navigation.connectStart, 'ms');
      this.reportPerformanceMetric('ssl_negotiation', navigation.connectEnd - navigation.secureConnectionStart, 'ms');
      this.reportPerformanceMetric('ttfb', navigation.responseStart - navigation.requestStart, 'ms');
      this.reportPerformanceMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms');
      this.reportPerformanceMetric('load_complete', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
      this.reportPerformanceMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart, 'ms');
    }
  }

  private trackResourceTiming() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 100) { // Only track slow resources
          this.reportPerformanceMetric(
            'resource_load_time',
            entry.duration,
            'ms'
          );
        }
      }
    }).observe({ entryTypes: ['resource'] });
  }

  public reportError(
    error: { message: string; stack?: string; name: string },
    context: { component?: string; action?: string } = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    if (!this.config.enableErrorTracking) return;
    if (Math.random() > this.config.sampleRate) return;

    const errorReport: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      timestamp: new Date().toISOString(),
      error,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        ...context
      },
      severity,
      fingerprint: this.generateErrorFingerprint(error)
    };

    this.errorQueue.push(errorReport);

    // Immediate flush for critical errors
    if (severity === 'critical') {
      this.flush();
    }
  }

  public reportPerformanceMetric(
    metric: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' | 'percent'
  ) {
    if (!this.config.enablePerformanceTracking) return;
    if (Math.random() > this.config.sampleRate) return;

    const performanceMetric: PerformanceMetric = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      timestamp: new Date().toISOString(),
      metric,
      value,
      unit,
      context: {
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType
      }
    };

    this.performanceQueue.push(performanceMetric);
  }

  public trackUserEvent(
    event: string,
    properties: Record<string, any> = {},
    userId?: string
  ) {
    if (!this.config.enableUserTracking) return;
    if (Math.random() > this.config.sampleRate) return;

    const userEvent: UserEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      timestamp: new Date().toISOString(),
      event,
      properties,
      userId,
      sessionId: this.sessionId,
      page: window.location.pathname
    };

    this.userEventQueue.push(userEvent);
  }

  public trackBusinessMetric(
    metric: string,
    value: number,
    dimensions: Record<string, string> = {}
  ) {
    if (!this.config.enableBusinessMetrics) return;

    const businessMetric: BusinessMetric = {
      id: `business_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      timestamp: new Date().toISOString(),
      metric,
      value,
      dimensions
    };

    this.businessMetricQueue.push(businessMetric);
  }

  private generateErrorFingerprint(error: { message: string; stack?: string; name: string }): string {
    const content = `${error.name}:${error.message}${error.stack || ''}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private async flush() {
    const payload = {
      errors: [...this.errorQueue],
      performance: [...this.performanceQueue],
      userEvents: [...this.userEventQueue],
      businessMetrics: [...this.businessMetricQueue],
      metadata: {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        environment: this.config.environment,
        url: window.location.href
      }
    };

    // Clear queues
    this.errorQueue = [];
    this.performanceQueue = [];
    this.userEventQueue = [];
    this.businessMetricQueue = [];

    // Don't send if no data
    if (payload.errors.length === 0 && 
        payload.performance.length === 0 && 
        payload.userEvents.length === 0 &&
        payload.businessMetrics.length === 0) {
      return;
    }

    try {
      // In production, send to your monitoring service
      if (this.config.environment === 'production') {
        await this.sendToMonitoringService(payload);
      } else {
        console.group('📊 Monitoring Data');
        console.log('Errors:', payload.errors);
        console.log('Performance:', payload.performance);
        console.log('User Events:', payload.userEvents);
        console.log('Business Metrics:', payload.businessMetrics);
        console.groupEnd();
      }
    } catch (error) {
      console.warn('Failed to send monitoring data:', error);
    }
  }

  private async sendToMonitoringService(payload: any) {
    // TODO: Integrate with your monitoring service
    // Examples: DataDog, New Relic, Sentry, LogRocket, etc.
    
    // Example implementation:
    await fetch('/api/monitoring', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  public destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

// Global monitor instance
let globalMonitor: ProductionMonitor | null = null;

export function initializeMonitoring(config?: Partial<MonitoringConfig>) {
  if (typeof window === 'undefined') return null;
  
  if (!globalMonitor) {
    globalMonitor = new ProductionMonitor(config);
  }
  return globalMonitor;
}

export function getMonitor(): ProductionMonitor | null {
  return globalMonitor;
}

// Convenience functions
export const reportError = (
  error: { message: string; stack?: string; name: string },
  context?: { component?: string; action?: string },
  severity?: 'low' | 'medium' | 'high' | 'critical'
) => {
  globalMonitor?.reportError(error, context, severity);
};

export const trackEvent = (
  event: string,
  properties?: Record<string, any>,
  userId?: string
) => {
  globalMonitor?.trackUserEvent(event, properties, userId);
};

export const trackPerformance = (
  metric: string,
  value: number,
  unit: 'ms' | 'bytes' | 'count' | 'percent'
) => {
  globalMonitor?.reportPerformanceMetric(metric, value, unit);
};

export const trackBusiness = (
  metric: string,
  value: number,
  dimensions?: Record<string, string>
) => {
  globalMonitor?.trackBusinessMetric(metric, value, dimensions);
};

// React hook for component-level monitoring
export function useMonitoring(componentName: string) {
  const reportComponentError = (error: Error, action: string = 'unknown') => {
    reportError(
      {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      {
        component: componentName,
        action
      },
      'medium'
    );
  };

  const trackComponentEvent = (event: string, properties?: Record<string, any>) => {
    trackEvent(`${componentName}.${event}`, {
      component: componentName,
      ...properties
    });
  };

  const trackComponentPerformance = (action: string, startTime: number) => {
    const duration = performance.now() - startTime;
    trackPerformance(`${componentName}.${action}`, duration, 'ms');
  };

  return {
    reportError: reportComponentError,
    trackEvent: trackComponentEvent,
    trackPerformance: trackComponentPerformance
  };
}

export default ProductionMonitor;
