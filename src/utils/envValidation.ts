// Environment variable validation
export function validateEnv() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    console.error('   Refer to .env.example for the complete list of required variables.');
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing required environment variables');
    }
  } else {
    console.log('✅ All required environment variables are set');
  }
}

// Only run validation in production or when explicitly requested
// This prevents issues during development server startup
export function runValidation() {
  if (typeof window === 'undefined') {
    validateEnv();
  }
}
