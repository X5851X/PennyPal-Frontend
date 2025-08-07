// Debug script untuk mengecek koneksi backend
const BACKEND_URL = 'https://pennypal-backend.ddns.net';

async function debugBackend() {
    console.log('🔍 Starting backend debug...');
    console.log('Backend URL:', BACKEND_URL);
    
    // Test 1: Basic connectivity
    console.log('\n1. Testing basic connectivity...');
    try {
        const response = await fetch(BACKEND_URL);
        console.log('✅ Basic connection:', response.status, response.statusText);
    } catch (error) {
        console.log('❌ Basic connection failed:', error.message);
    }
    
    // Test 2: Health endpoint
    console.log('\n2. Testing health endpoint...');
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        const data = await response.json();
        console.log('✅ Health check:', data);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
    }
    
    // Test 3: Auth endpoint
    console.log('\n3. Testing auth endpoint...');
    try {
        const response = await fetch(`${BACKEND_URL}/auth/test`);
        const data = await response.json();
        console.log('✅ Auth test:', data);
    } catch (error) {
        console.log('❌ Auth test failed:', error.message);
    }
    
    // Test 4: CORS preflight
    console.log('\n4. Testing CORS...');
    try {
        const response = await fetch(`${BACKEND_URL}/health`, {
            method: 'OPTIONS'
        });
        console.log('✅ CORS preflight:', response.status);
    } catch (error) {
        console.log('❌ CORS preflight failed:', error.message);
    }
    
    // Test 5: DNS resolution
    console.log('\n5. Testing DNS resolution...');
    try {
        const start = Date.now();
        await fetch(`${BACKEND_URL}/health`);
        const end = Date.now();
        console.log(`✅ DNS resolution time: ${end - start}ms`);
    } catch (error) {
        console.log('❌ DNS resolution failed:', error.message);
    }
}

// Run debug if in browser
if (typeof window !== 'undefined') {
    debugBackend();
}

// Export for Node.js
if (typeof module !== 'undefined') {
    module.exports = { debugBackend };
}