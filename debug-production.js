// Production Debug Script
console.log('=== Production Debug ===');

// Environment check
console.log('Environment:', import.meta.env.MODE);
console.log('Backend URL:', import.meta.env.VITE_BACKEND);
console.log('Frontend URL:', import.meta.env.VITE_FRONTEND_URL);

// Test backend connection
async function testBackend() {
  const backendUrl = 'https://pennypal-backend.ddns.net';
  
  try {
    console.log('Testing backend health...');
    const response = await fetch(`${backendUrl}/health`);
    const data = await response.json();
    console.log('✅ Backend Status:', data);
    
    // Test auth endpoint
    const authTest = await fetch(`${backendUrl}/auth/test`);
    console.log('✅ Auth endpoint status:', authTest.status);
    
  } catch (error) {
    console.error('❌ Backend Error:', error);
  }
}

// Test OAuth URL
function testOAuthURL() {
  const backendUrl = 'https://pennypal-backend.ddns.net';
  const frontendUrl = window.location.origin;
  const oauthUrl = `${backendUrl}/auth/google?redirect=${encodeURIComponent(frontendUrl + '/oauth-redirect')}`;
  
  console.log('OAuth URL:', oauthUrl);
  return oauthUrl;
}

// Check current page
function checkCurrentPage() {
  console.log('Current URL:', window.location.href);
  console.log('Origin:', window.location.origin);
  console.log('Pathname:', window.location.pathname);
  
  // Check for OAuth params
  const params = new URLSearchParams(window.location.search);
  if (params.get('token')) {
    console.log('✅ OAuth token found');
  }
  if (params.get('error')) {
    console.log('❌ OAuth error:', params.get('error'));
  }
}

// Run tests
testBackend();
const oauthUrl = testOAuthURL();
checkCurrentPage();

// Export for manual use
window.debugProduction = {
  testBackend,
  testOAuthURL,
  checkCurrentPage,
  oauthUrl
};