const http = require('http');

// Test the events API endpoint
function testEventsAPI() {
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3000/api/events', {
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Events API Response:', res.statusCode);
        if (res.statusCode === 200) {
          console.log('📋 Events API test passed');
          resolve(true);
        } else {
          console.log('❌ Events API test failed with status:', res.statusCode);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Events API connection error:', error.message);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log('❌ Events API request timed out');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Test the authentication configuration
function testAuthConfig() {
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3000/api/auth/csrf', {
      method: 'GET',
      timeout: 5000
    }, (res) => {
      console.log('✅ Auth CSRF endpoint status:', res.statusCode);
      resolve(res.statusCode === 200);
    });
    
    req.on('error', (error) => {
      console.log('❌ Auth CSRF endpoint error:', error.message);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log('❌ Auth CSRF request timed out');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting API endpoint tests...\n');
  
  const eventsTest = await testEventsAPI();
  console.log('');
  
  const authTest = await testAuthConfig();
  console.log('');
  
  console.log('📊 Test Results:');
  console.log('Events API:', eventsTest ? '✅ PASS' : '❌ FAIL');
  console.log('Auth Config:', authTest ? '✅ PASS' : '❌ FAIL');
  
  if (eventsTest && authTest) {
    console.log('\n🎉 All critical API tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the development server.');
    process.exit(1);
  }
}

runTests().catch(console.error);
