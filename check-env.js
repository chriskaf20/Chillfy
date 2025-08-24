// Simple environment check script
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY', 
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

console.log('🔍 Checking environment variables...\n');

let allSet = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}... (set)`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allSet = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allSet) {
  console.log('🎉 All required environment variables are set!');
} else {
  console.log('⚠️  Missing some environment variables');
  console.log('💡 Please check your .env.local file');
}
console.log('='.repeat(50));
