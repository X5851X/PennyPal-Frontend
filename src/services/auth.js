import axios from 'axios';

// Base URL configuration - Fixed for Vite
const getApiBaseUrl = () => {
  // Use direct endpoints in development (proxy handles routing)
  if (import.meta.env.DEV) {
    return '';
  }
  return import.meta.env.VITE_BACKEND || 'https://pennypal-backend.ddns.net';
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance with default config
const authAPI = axios.create({
  baseURL: import.meta.env.DEV ? '/auth' : `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Increased timeout for better stability
});

// Safe localStorage operations with error handling
const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof Storage !== 'undefined' && localStorage) {
        return localStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.warn('localStorage not available:', error);
      return null;
    }
  },
  
  setItem: (key, value) => {
    try {
      if (typeof Storage !== 'undefined' && localStorage) {
        localStorage.setItem(key, value);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('localStorage not available:', error);
      return false;
    }
  },
  
  removeItem: (key) => {
    try {
      if (typeof Storage !== 'undefined' && localStorage) {
        localStorage.removeItem(key);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('localStorage not available:', error);
      return false;
    }
  }
};

// Request interceptor to add auth token
authAPI.interceptors.request.use(
  (config) => {
    const token = safeStorage.getItem('pennypal_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
authAPI.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      safeStorage.removeItem('pennypal_token');
      safeStorage.removeItem('pennypal_user');
      
      // Only redirect if not already on home page
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        console.log('Unauthorized access, redirecting to home');
        window.location.href = '/';
      }
    } else if (error.response?.status === 403) {
      console.error('Access forbidden');
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.status);
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    }
    
    return Promise.reject(error);
  }
);

// Enhanced error handling function
const handleAuthError = (error, operation = 'operation') => {
  console.error(`${operation} error:`, error);
  console.error('Error details:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message,
    code: error.code
  });
  
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;
    
    if (status === 400) {
      return { message: data?.message || 'Invalid request data' };
    } else if (status === 401) {
      return { message: data?.message || 'Invalid credentials' };
    } else if (status === 403) {
      return { message: data?.message || 'Access forbidden' };
    } else if (status === 404) {
      return { message: data?.message || 'Service not found' };
    } else if (status === 409) {
      return { message: data?.message || 'Conflict - resource already exists' };
    } else if (status === 422) {
      return { message: data?.message || 'Validation failed' };
    } else if (status >= 500) {
      const serverMsg = data?.message || data?.error || 'Server error';
      return { message: `Server error: ${serverMsg}. Please try again later.` };
    } else {
      return { message: data?.message || `Request failed with status ${status}` };
    }
  } else if (error.request) {
    // Network error
    if (error.code === 'ECONNABORTED') {
      return { message: 'Request timeout. Please check your connection and try again.' };
    } else {
      return { message: 'Network error. Please check your connection and try again.' };
    }
  } else {
    // Other error
    return { message: error.message || `${operation} failed` };
  }
};

// Authentication Services
export const authService = {
  // Sign Up
  signup: async (name, email, password) => {
    try {
      console.log('Attempting signup for:', email);
      
      const response = await authAPI.post('/signup', {
        username: name, // Backend expects 'username', not 'name'
        email,
        password,
      });
      
      console.log('Signup response:', response.data);
      
      // Store token and user data if registration successful
      if (response.data.token) {
        safeStorage.setItem('pennypal_token', response.data.token);
        if (response.data.user) {
          safeStorage.setItem('pennypal_user', JSON.stringify(response.data.user));
        }
        
        // Redirect to dashboard after successful signup
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      }
      
      return response.data;
    } catch (error) {
      throw handleAuthError(error, 'signup');
    }
  },

  // Sign In
  signin: async (email, password) => {
    try {
      console.log('Attempting signin for:', email);
      
      const response = await authAPI.post('/signin', {
        email,
        password,
      });
      
      console.log('Signin response:', response.data);
      
      // Store token and user data if login successful
      if (response.data.token) {
        safeStorage.setItem('pennypal_token', response.data.token);
        if (response.data.user) {
          safeStorage.setItem('pennypal_user', JSON.stringify(response.data.user));
        }
        
        // Redirect to dashboard after successful login
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      }
      
      return response.data;
    } catch (error) {
      throw handleAuthError(error, 'signin');
    }
  },

  // Sign Out
  signout: async () => {
    try {
      console.log('Attempting signout');
      await authAPI.post('/signout');
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error for logout - always proceed with cleanup
    } finally {
      // Always clear local storage
      safeStorage.removeItem('pennypal_token');
      safeStorage.removeItem('pennypal_user');
      
      // Redirect to home
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  },

  // Get Current User
  getCurrentUser: () => {
    try {
      const user = safeStorage.getItem('pennypal_user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      // Clean up corrupted data
      safeStorage.removeItem('pennypal_user');
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = safeStorage.getItem('pennypal_token');
    const user = safeStorage.getItem('pennypal_user');
    return !!(token && user);
  },

  // Get auth token
  getToken: () => {
    return safeStorage.getItem('pennypal_token');
  },

  // Refresh Token
  refreshToken: async () => {
    try {
      console.log('Attempting token refresh');
      
      const response = await authAPI.post('/refresh');
      
      if (response.data.token) {
        safeStorage.setItem('pennypal_token', response.data.token);
        console.log('Token refreshed successfully');
      }
      
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      await authService.signout();
      throw handleAuthError(error, 'token refresh');
    }
  },

  // Forgot Password
  forgotPassword: async (email) => {
    try {
      console.log('Requesting password reset for:', email);
      
      const response = await authAPI.post('/forgot-password', { email });
      console.log('Password reset email sent');
      
      return response.data;
    } catch (error) {
      throw handleAuthError(error, 'forgot password');
    }
  },

  // Reset Password
  resetPassword: async (token, newPassword) => {
    try {
      console.log('Attempting password reset');
      
      const response = await authAPI.post('/reset-password', {
        token,
        password: newPassword,
      });
      
      console.log('Password reset successful');
      return response.data;
    } catch (error) {
      throw handleAuthError(error, 'password reset');
    }
  },

  // Change Password
  changePassword: async (currentPassword, newPassword) => {
    try {
      console.log('Attempting password change');
      
      const response = await authAPI.post('/change-password', {
        currentPassword,
        newPassword,
      });
      
      console.log('Password changed successfully');
      return response.data;
    } catch (error) {
      throw handleAuthError(error, 'password change');
    }
  },

  // Verify Email
  verifyEmail: async (token) => {
    try {
      console.log('Attempting email verification');
      
      const response = await authAPI.post('/verify-email', { token });
      console.log('Email verified successfully');
      
      return response.data;
    } catch (error) {
      throw handleAuthError(error, 'email verification');
    }
  },

  // Resend Verification Email
  resendVerification: async (email) => {
    try {
      console.log('Resending verification email to:', email);
      
      const response = await authAPI.post('/resend-verification', { email });
      console.log('Verification email resent');
      
      return response.data;
    } catch (error) {
      throw handleAuthError(error, 'resend verification');
    }
  },

  // Google OAuth
  googleAuth: () => {
    console.log('Redirecting to Google OAuth');
    const backendUrl = import.meta.env.VITE_BACKEND || 'https://pennypal-backend.ddns.net';
    window.location.href = `${backendUrl}/auth/google`;
  },

  // Handle OAuth Callback
  handleOAuthCallback: (token, user) => {
    try {
      console.log('Handling OAuth callback');
      
      if (token) {
        safeStorage.setItem('pennypal_token', token);
        if (user) {
          safeStorage.setItem('pennypal_user', JSON.stringify(user));
        }
        
        // Redirect to dashboard after successful OAuth
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('OAuth callback error:', error);
      return false;
    }
  },

  // Update User Profile
  updateProfile: async (userData) => {
    try {
      console.log('Updating user profile');
      
      const response = await authAPI.put('/profile', userData);
      
      // Update stored user data
      if (response.data.user) {
        safeStorage.setItem('pennypal_user', JSON.stringify(response.data.user));
        console.log('Profile updated successfully');
      }
      
      return response.data;
    } catch (error) {
      throw handleAuthError(error, 'profile update');
    }
  },

  // Delete Account
  deleteAccount: async (password) => {
    try {
      console.log('Attempting account deletion');
      
      const response = await authAPI.delete('/account', {
        data: { password }
      });
      
      // Clear all data on successful deletion
      safeStorage.removeItem('pennypal_token');
      safeStorage.removeItem('pennypal_user');
      
      console.log('Account deleted successfully');
      
      // Redirect to home
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
      return response.data;
    } catch (error) {
      throw handleAuthError(error, 'account deletion');
    }
  },

  // Health Check
  healthCheck: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', message: 'Service unavailable' };
    }
  },

  // Test Connection
  testConnection: async () => {
    try {
      const response = await authAPI.get('/test');
      return response.data;
    } catch (error) {
      console.error('Connection test failed:', error);
      return { status: 'error', message: 'Connection failed' };
    }
  }
};

// Legacy exports for backward compatibility
export const signup = (name, email, password) => {
  return authService.signup(name, email, password);
};

export const signin = (email, password) => {
  return authService.signin(email, password);
};

// Utility function to check service availability
export const checkServiceAvailability = async () => {
  try {
    const health = await authService.healthCheck();
    return health.status === 'ok' || health.status === 'healthy';
  } catch (error) {
    console.error('Service availability check failed:', error);
    return false;
  }
};

// Default export
export default authService;