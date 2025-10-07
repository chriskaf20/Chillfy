"use client";
import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthErrorBoundary 
      onError={(error, errorInfo) => {
        console.error('🚨 [Providers] Auth error boundary caught:', error, errorInfo);
        
        // Log to your error reporting service here
        // Example: Sentry.captureException(error, { extra: errorInfo });
      }}
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </AuthErrorBoundary>
  );
}