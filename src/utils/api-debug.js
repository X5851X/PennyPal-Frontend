// API Debug utilities
export const debugApi = {
  // Test basic connectivity
  async testConnection() {
    const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND || 'https://pennypal-backend.ddns.net');
    
    console.log('🔍 Testing API connection...');
    console.log('Base URL:', baseUrl);
    console.log('Environment:', import.meta.env.DEV ? 'Development' : 'Production');
    
    try {
      const response = await fetch(`${baseUrl}/health`);
      const data = await response.json();
      console.log('✅ Connection successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Connection failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Test auth endpoint
  async testAuth() {
    const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND || 'https://pennypal-backend.ddns.net');
    
    try {
      const response = await fetch(`${baseUrl}/auth/test`);
      const data = await response.json();
      console.log('✅ Auth endpoint working:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Auth endpoint failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current API configuration
  getConfig() {
    return {
      isDev: import.meta.env.DEV,
      baseUrl: import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND || 'https://pennypal-backend.ddns.net'),
      backendUrl: import.meta.env.VITE_BACKEND,
      mode: import.meta.env.MODE
    };
  }
};

// Auto-run debug in development
if (import.meta.env.DEV) {
  console.log('🚀 API Debug Info:', debugApi.getConfig());
}

export default debugApi;