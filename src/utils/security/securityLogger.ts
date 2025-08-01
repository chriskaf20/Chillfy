export class SecurityLogger {
  logSecurityThreat(type: string, details: unknown) {
    // You can log to your monitoring service here
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[SECURITY] [${type}]`, details);
    }
    // Add production logging as needed
  }
}