/* eslint-disable react/display-name */
"use client";
import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Shield, Bug, Network } from 'lucide-react';
import { RefreshTokenManager } from '@/utils/refreshTokenManager';
import { SessionRecovery } from '@/utils/sessionRecovery';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorType: 'auth' | 'network' | 'timeout' | 'refresh_token' | 'unknown';
  retryCount: number;
  isClearing: boolean;
}

interface AuthErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  fallback?: ReactNode;
}

export class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0,
      isClearing: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AuthErrorBoundaryState> {
    console.error('🚨 [AuthErrorBoundary] Error caught:', error);
    
    // Determine error type based on error message/properties
    let errorType: AuthErrorBoundaryState['errorType'] = 'unknown';
    
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('refresh_token') || 
        errorMessage.includes('already used') ||
        errorMessage.includes('invalid refresh token')) {
      errorType = 'refresh_token';
    } else if (errorMessage.includes('network') || 
               errorMessage.includes('fetch') ||
               errorMessage.includes('connection')) {
      errorType = 'network';
    } else if (errorMessage.includes('timeout') ||
               errorMessage.includes('took too long')) {
      errorType = 'timeout';
    } else if (errorMessage.includes('unauthorized') ||
               errorMessage.includes('authentication') ||
               errorMessage.includes('auth')) {
      errorType = 'auth';
    }

    return {
      hasError: true,
      error,
      errorType
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 [AuthErrorBoundary] Component error details:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      timestamp: new Date().toISOString()
    });

    this.setState({ errorInfo });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-clear refresh token errors
    if (this.state.errorType === 'refresh_token') {
      this.handleClearAuthState();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private handleRetry = () => {
    console.log('🔄 [AuthErrorBoundary] Retrying...');
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleClearAuthState = async () => {
    console.log('🧹 [AuthErrorBoundary] Clearing auth state...');
    
    this.setState({ isClearing: true });
    
    try {
      // Clear all auth storage
      if (typeof window !== 'undefined') {
        // Clear localStorage
        const localKeys = Object.keys(localStorage);
        localKeys.forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
        
        // Clear sessionStorage
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
            sessionStorage.removeItem(key);
          }
        });
      }

      // Reset managers
      RefreshTokenManager.getInstance().reset();
      await SessionRecovery.getInstance().cleanup();

      // Clear server session
      try {
        await fetch("/api/auth/clear-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        console.warn('⚠️ [AuthErrorBoundary] Error clearing server session:', e);
      }

      console.log('✅ [AuthErrorBoundary] Auth state cleared');
      
      // Auto-retry after clearing
      this.retryTimeout = setTimeout(() => {
        this.handleRetry();
      }, 1000);
      
    } catch (error) {
      console.error('❌ [AuthErrorBoundary] Error clearing auth state:', error);
    } finally {
      this.setState({ isClearing: false });
    }
  };

  private handleReload = () => {
    console.log('🔄 [AuthErrorBoundary] Reloading page...');
    window.location.reload();
  };

  private getErrorIcon = () => {
    switch (this.state.errorType) {
      case 'auth':
        return <Shield className="h-8 w-8 text-red-500" />;
      case 'network':
        return <Network className="h-8 w-8 text-blue-500" />;
      case 'timeout':
        return <RefreshCw className="h-8 w-8 text-purple-500" />;
      case 'refresh_token':
        return <AlertTriangle className="h-8 w-8 text-orange-500" />;
      default:
        return <Bug className="h-8 w-8 text-gray-500" />;
    }
  };

  private getErrorTitle = () => {
    switch (this.state.errorType) {
      case 'auth':
        return 'Authentication Error';
      case 'network':
        return 'Network Connection Error';
      case 'timeout':
        return 'Request Timeout';
      case 'refresh_token':
        return 'Session Token Error';
      default:
        return 'Application Error';
    }
  };

  private getErrorMessage = () => {
    switch (this.state.errorType) {
      case 'auth':
        return 'There was a problem with your authentication. Please sign in again.';
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'timeout':
        return 'The request took too long to complete. Please try again.';
      case 'refresh_token':
        return 'Your session has expired or become corrupted. We\'re clearing it automatically.';
      default:
        return 'An unexpected error occurred. Please try again or reload the page.';
    }
  };

  private getErrorActions = () => {
    const { errorType, isClearing } = this.state;
    
    return (
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {errorType === 'refresh_token' ? (
          <button
            onClick={this.handleClearAuthState}
            disabled={isClearing}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isClearing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Clearing Session...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Clear Session
              </>
            )}
          </button>
        ) : (
          <button
            onClick={this.handleRetry}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        )}
        
        {errorType !== 'refresh_token' && (
          <button
            onClick={this.handleClearAuthState}
            disabled={isClearing}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isClearing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Clear Auth State
              </>
            )}
          </button>
        )}
        
        <button
          onClick={this.handleReload}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reload Page
        </button>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="mb-6">
                {this.getErrorIcon()}
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {this.getErrorTitle()}
              </h1>
              
              <p className="text-gray-600 mb-6">
                {this.getErrorMessage()}
              </p>

              {this.state.retryCount > 0 && (
                <p className="text-sm text-gray-500 mb-4">
                  Retry attempts: {this.state.retryCount}
                </p>
              )}

              {this.getErrorActions()}

              {/* Technical details (collapsible) */}
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-700 max-h-40 overflow-auto">
                  <div><strong>Error:</strong> {this.state.error?.message}</div>
                  <div><strong>Type:</strong> {this.state.errorType}</div>
                  <div><strong>Time:</strong> {new Date().toLocaleString()}</div>
                  {this.state.error?.stack && (
                    <div className="mt-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary in functional components
export const useAuthErrorHandler = () => {
  const handleAuthError = (error: Error) => {
    console.error('🚨 [AuthErrorHandler] Handling auth error:', error);
    
    // Determine if this should trigger error boundary
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('refresh_token') || 
        errorMessage.includes('already used') ||
        errorMessage.includes('session') ||
        errorMessage.includes('unauthorized')) {
      // Throw to be caught by error boundary
      throw error;
    }
    
    // Handle non-critical errors locally
    console.warn('⚠️ [AuthErrorHandler] Non-critical auth error:', error.message);
  };

  return { handleAuthError };
};
