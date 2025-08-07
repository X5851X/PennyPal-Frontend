// OAuth Debug Script
console.log('=== OAuth Debug Information ===');

// Environment variables
console.log('Environment Variables:');
console.log('VITE_BACKEND:', import.meta.env.VITE_BACKEND);
console.log('VITE_OAUTH_REDIRECT_URL:', import.meta.env.VITE_OAUTH_REDIRECT_URL);
console.log('VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);

// Current URL info
console.log('\nCurrent URL Info:');
console.log('Current URL:', window.location.href);
console.log('Origin:', window.location.origin);
console.log('Pathname:', window.location.pathname);
console.log('Search:', window.location.search);

// URL Parameters
const urlParams = new URLSearchParams(window.location.search);
console.log('\nURL Parameters:');
console.log('token:', urlParams.get('token'));
console.log('error:', urlParams.get('error'));
console.log('code:', urlParams.get('code'));
console.log('state:', urlParams.get('state'));

// Storage info
console.log('\nStorage Info:');
console.log('pennypal_token:', localStorage.getItem('pennypal_token'));
console.log('pennypal_user:', localStorage.getItem('pennypal_user'));

// Test backend connection
async function testBackend() {
  const backendUrl = import.meta.env.VITE_BACKEND || 'https://pennypal-backend.ddns.net';
  console.log('\nTesting Backend Connection:');
  console.log('Backend URL:', backendUrl);
  
  try {
    const response = await fetch(`${backendUrl}/health`);
    console.log('Backend Status:', response.status);
    const data = await response.json();
    console.log('Backend Response:', data);
  } catch (error) {
    console.error('Backend Error:', error);
  }
}

// Test Google OAuth URL
function testGoogleOAuthURL() {
  const backendUrl = import.meta.env.VITE_BACKEND || 'https://pennypal-backend.ddns.net';
  const googleOAuthURL = `${backendUrl}/auth/google`;
  console.log('\nGoogle OAuth URL:', googleOAuthURL);
  return googleOAuthURL;
}

// Run tests
testBackend();
const oauthURL = testGoogleOAuthURL();

console.log('\n=== Debug Complete ===');
console.log('If OAuth fails, check:');
console.log('1. Google Console redirect URIs');
console.log('2. Backend server status');
console.log('3. Environment variables');
console.log('4. Network connectivity');

// Export for manual testing
window.debugOAuth = {
  testBackend,
  testGoogleOAuthURL,
  oauthURL
};