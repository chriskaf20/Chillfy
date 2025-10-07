"use client";

import { useEffect } from 'react';
import { initializeMonitoring } from '@/utils/monitoring';

export function MonitoringInitializer() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize monitoring with production configuration
      initializeMonitoring({
        enableErrorTracking: true,
        enablePerformanceTracking: true,
        enableUserTracking: process.env.NODE_ENV === 'production',
        enableBusinessMetrics: true,
        sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% sampling in production
        environment: process.env.NODE_ENV as any || 'development'
      });

      console.log('🚀 Chillfy monitoring system initialized');
    }
  }, []);

  return null; // This component doesn't render anything
}
