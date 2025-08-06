import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND || 'http://localhost:3000';
const API_URL = `${API_BASE_URL}/ai`;

const eliceAPI = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add auth token to requests
eliceAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('pennypal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const eliceService = {
  // Get financial advice from AI assistant
  getFinancialAdvice: async (message, context = '') => {
    try {
      const response = await eliceAPI.post('/chat', {
        message,
        context
      });
      return response.data;
    } catch (error) {
      console.error('Financial advice error:', error);
      // Return fallback response
      return {
        success: true,
        data: {
          message: "I'm here to help with your finances! Try asking about budgeting, saving money, or expense management.",
          usage: { total_tokens: 0 }
        }
      };
    }
  },

  // Auto-categorize expense using AI
  categorizeExpense: async (description) => {
    try {
      const response = await eliceAPI.post('/categorize', {
        description
      });
      return response.data;
    } catch (error) {
      console.error('Expense categorization error:', error);
      throw error;
    }
  },

  // Analyze spending patterns
  analyzeSpending: async (expenses) => {
    try {
      const response = await eliceAPI.post('/analyze', {
        expenses
      });
      return response.data;
    } catch (error) {
      console.error('Spending analysis error:', error);
      throw error;
    }
  },

  // Get AI service info
  getServiceInfo: async () => {
    try {
      const response = await eliceAPI.get('/');
      return response.data;
    } catch (error) {
      console.error('Service info error:', error);
      throw error;
    }
  }
};

export default eliceService;