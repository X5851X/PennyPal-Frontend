import axios from 'axios';
import eliceService from './elice.js';

const getApiBase = () => {
  // Use direct endpoints in development (proxy handles routing)
  if (import.meta.env.DEV) {
    return '';
  }
  return import.meta.env.VITE_BACKEND || 'https://pennypal-backend.ddns.net';
};

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: import.meta.env.DEV ? '' : API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pennypal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔑 Using token for API request:', token.substring(0, 20) + '...');
  } else {
    console.warn('⚠️ No token found for API request');
  }
  return config;
});

export const transactionService = {
  getTransactions: async (params = {}) => {
    const response = await api.get('/transaction', { params });
    return response.data;
  },

  createTransaction: async (data) => {
    const response = await api.post('/transaction', data);
    return response.data;
  },

  updateTransaction: async (id, data) => {
    const response = await api.put(`/transaction/${id}`, data);
    return response.data;
  },

  deleteTransaction: async (id) => {
    const response = await api.delete(`/transaction/${id}`);
    return response.data;
  },

  getAnalytics: async (params) => {
    const response = await api.get('/transaction/analytics', { params });
    return response.data;
  },

  scanReceipt: async (imageData, filename = 'receipt.jpg') => {
    const response = await api.post('/ocr/receipt', {
      imageData,
      filename,
      useGoogleVision: true
    });
    return response.data;
  },

  convertCurrency: async (amount, fromCurrency, toCurrency) => {
    const response = await api.post('/currency/convert', {
      amount,
      fromCurrency,
      toCurrency
    });
    return response.data;
  },

  getCurrencyRates: async () => {
    const response = await api.get('/currency/valid');
    return response.data;
  },

  refreshCurrencyRates: async () => {
    const response = await api.post('/currency/refresh', { base: 'USD' });
    return response.data;
  },

  // AI-powered features using Elice API
  getFinancialAdvice: async (message, context) => {
    return await eliceService.getFinancialAdvice(message, context);
  },

  categorizeExpenseAI: async (description) => {
    return await eliceService.categorizeExpense(description);
  },

  analyzeSpendingPatterns: async (expenses) => {
    return await eliceService.analyzeSpending(expenses);
  }
};

export default transactionService;