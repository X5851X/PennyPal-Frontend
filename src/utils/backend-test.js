// Backend connectivity test
export const testBackend = async () => {
  const baseUrl = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_BACKEND || 'https://pennypal-backend.ddns.net');
  
  console.log('🔍 Testing backend connectivity...');
  console.log('Base URL:', baseUrl);
  
  const tests = [
    { name: 'Health Check', url: `${baseUrl}/health` },
    { name: 'Auth Test', url: `${baseUrl}/auth/test` },
    { name: 'Root Endpoint', url: baseUrl }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const response = await fetch(test.url);
      const data = await response.text();
      
      results.push({
        name: test.name,
        status: response.status,
        success: response.ok,
        data: data.substring(0, 200) // First 200 chars
      });
      
      console.log(`✅ ${test.name}: ${response.status} ${response.statusText}`);
    } catch (error) {
      results.push({
        name: test.name,
        success: false,
        error: error.message
      });
      
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  return results;
};

// Test specific signin endpoint
export const testSignin = async (email = 'test@example.com', password = 'test123') => {
  const baseUrl = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_BACKEND || 'https://pennypal-backend.ddns.net');
  
  try {
    console.log('🔍 Testing signin endpoint...');
    const response = await fetch(`${baseUrl}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.text();
    console.log('Signin response:', {
      status: response.status,
      statusText: response.statusText,
      data: data.substring(0, 500)
    });
    
    return {
      status: response.status,
      success: response.ok,
      data
    };
  } catch (error) {
    console.error('Signin test error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default { testBackend, testSignin };