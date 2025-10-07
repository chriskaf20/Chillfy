"use client";
import React, { Component, ReactNode } from 'react';
import { AlertTriangle, Home, Bug, Mail, RefreshCw } from 'lucide-react';

interface ErrorInfo {
  componentStack: string;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  isReporting: boolean;
  retryCount: number;
}

interface AppErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  private maxRetries = 3;

  constructor(props: AppErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      isReporting: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.error('🚨 [AppErrorBoundary] Application error caught:', {
      error: error.message,
      stack: error.stack,
      errorId
    });

    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log detailed error information
    console.error('🚨 [AppErrorBoundary] Component stack:', errorInfo.componentStack);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.state.errorId);
    }

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    this.setState({ isReporting: true });

    try {
      // In production, you'd send this to your error monitoring service
      // (Sentry, LogRocket, Bugsnag, etc.)
      const errorReport = {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      };

      // For now, just log it
      console.log('📊 [AppErrorBoundary] Error report:', errorReport);

      // TODO: Send to monitoring service
      // await fetch('/api/errors/report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });

    } catch (reportingError) {
      console.error('❌ [AppErrorBoundary] Failed to report error:', reportingError);
    } finally {
      this.setState({ isReporting: false });
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Max retries reached, force page reload
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private copyErrorId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.state.errorId);
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId, retryCount, isReporting } = this.state;
      const canRetry = retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-lg w-full">
            <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-red-100 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              {/* Error Message */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-600 mb-4">
                  We encountered an unexpected error. Our team has been notified.
                </p>
                
                {process.env.NODE_ENV === 'development' && error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                    <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                      <Bug className="w-4 h-4 mr-2" />
                      Development Error Details:
                    </h4>
                    <p className="text-sm text-red-700 font-mono break-all">
                      {error.message}
                    </p>
                  </div>
                )}

                {/* Error ID */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Error ID:</p>
                  <button
                    onClick={this.copyErrorId}
                    className="text-sm font-mono text-gray-700 hover:text-gray-900 transition-colors"
                    title="Click to copy error ID"
                  >
                    {errorId}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {canRetry ? (
                  <button
                    onClick={this.handleRetry}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                    disabled={isReporting}
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Try Again ({this.maxRetries - retryCount} attempts left)
                  </button>
                ) : (
                  <button
                    onClick={this.handleReload}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                    disabled={isReporting}
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Reload Page
                  </button>
                )}

                <button
                  onClick={this.handleGoHome}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                  disabled={isReporting}
                >
                  <Home className="w-5 h-5 mr-2" />
                  Go to Homepage
                </button>

                <a
                  href="mailto:support@chillfy.com?subject=Error Report&body=Error ID: {errorId}"
                  className="w-full bg-blue-50 text-blue-700 py-3 px-4 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center text-decoration-none"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Support
                </a>
              </div>

              {/* Reporting Status */}
              {isReporting && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                    Reporting error...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience hook for functional components
export function useErrorHandler() {
  const reportError = (error: Error, context?: string) => {
    console.error(`🚨 [useErrorHandler] ${context || 'Unhandled error'}:`, error);
    
    // In production, report to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Report to error monitoring service
    }
  };

  return { reportError };
}
