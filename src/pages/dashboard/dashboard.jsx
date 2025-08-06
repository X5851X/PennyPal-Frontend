import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  Camera,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Wallet,
  Receipt,
  Target,
  Eye,
  MoreHorizontal,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Calendar,
  Clock,
  Cloud
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import Layout from '../../components/layout';
import { authService } from '../../services/auth';
import { transactionService } from '../../services/transaction';
import './dashboard.css';

const Dashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [baseCurrency, setBaseCurrency] = useState(() => {
    return localStorage.getItem('pennypal_base_currency') || 'IDR';
  });
  const [exchangeRates, setExchangeRates] = useState({});
  const [wordcloudData, setWordcloudData] = useState(null);
  const [wordcloudLoading, setWordcloudLoading] = useState(false);
  const [quickInsights, setQuickInsights] = useState([]);

  // Get API base URL
  const getApiUrl = useCallback(() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    return process.env.REACT_APP_API_URL || 'https://your-backend-url.com';
  }, []);

  // Check authentication
  const checkAuth = useCallback(() => {
    if (!authService.isAuthenticated()) {
      setError('Please login to continue');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      return false;
    }
    return true;
  }, []);

  // Get greeting based on time
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    const name = authService.getCurrentUser()?.name || 'there';
    let greeting = '';
    let emoji = '';

    if (hour < 5) {
      greeting = 'Good Night';
      emoji = '🌙';
    } else if (hour < 12) {
      greeting = 'Good Morning';
      emoji = '🌅';
    } else if (hour < 17) {
      greeting = 'Good Afternoon';
      emoji = '☀️';
    } else if (hour < 21) {
      greeting = 'Good Evening';
      emoji = '🌆';
    } else {
      greeting = 'Good Night';
      emoji = '🌃';
    }

    return {
      text: `${greeting}, ${name}!`,
      emoji,
      timeBasedTip: getTimeBasedTip(hour)
    };
  }, []);

  // Get time-based financial tip
  const getTimeBasedTip = useCallback((hour) => {
    if (hour < 10) return "Great time to check yesterday's expenses!";
    if (hour < 14) return "Perfect time to track your lunch expenses.";
    if (hour < 18) return "Don't forget to log your afternoon transactions.";
    return "Evening is great for reviewing your daily spending.";
  }, []);

  // Enhanced currency formatting
  const formatCurrency = useCallback((amount, currencyCode = baseCurrency) => {
    if (isNaN(amount) || amount === null || amount === undefined) return `${currencyCode} 0`;
    
    const currencySymbols = {
      IDR: 'Rp',
      USD: '$',
      EUR: '€',
      JPY: '¥',
      SGD: 'S$',
      MYR: 'RM',
      AUD: 'A$',
      GBP: '£',
      CHF: 'CHF',
      CAD: 'C$',
      KRW: '₩'
    };
    
    const symbol = currencySymbols[currencyCode] || currencyCode;
    const absAmount = Math.abs(amount);
    
    if (currencyCode === 'IDR' || currencyCode === 'KRW' || currencyCode === 'JPY') {
      return `${symbol} ${Math.round(absAmount).toLocaleString('id-ID')}`;
    }
    return `${symbol} ${absAmount.toLocaleString('id-ID', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }, [baseCurrency]);

  // Format short currency for cards
  const formatShortCurrency = useCallback((amount, currencyCode = baseCurrency) => {
    if (isNaN(amount)) return formatCurrency(0, currencyCode);
    
    const absAmount = Math.abs(amount);
    const symbol = currencyCode === 'IDR' ? 'Rp' : currencyCode;
    
    if (absAmount >= 1000000000) {
      return `${symbol} ${(absAmount / 1000000000).toFixed(1)}B`;
    } else if (absAmount >= 1000000) {
      return `${symbol} ${(absAmount / 1000000).toFixed(1)}M`;
    } else if (absAmount >= 1000) {
      return `${symbol} ${(absAmount / 1000).toFixed(1)}K`;
    }
    return formatCurrency(amount, currencyCode);
  }, [baseCurrency, formatCurrency]);

  // Currency conversion - simplified version like in analytics
  const convertCurrency = useMemo(() => {
    return (amount, fromCurrency, toCurrency) => {
      if (fromCurrency === toCurrency) return amount;
      
      const rates = {
        USD: 1, IDR: 15800, KRW: 1350, EUR: 0.85, JPY: 110,
        SGD: 1.35, MYR: 4.2, AUD: 1.4, GBP: 0.75, CHF: 0.92, CAD: 1.25
      };
      
      if (!rates[fromCurrency] || !rates[toCurrency]) return amount;
      
      const usdAmount = amount / rates[fromCurrency];
      return Math.round((usdAmount * rates[toCurrency]) * 100) / 100;
    };
  }, []);

  // Fetch exchange rates
  const fetchExchangeRates = useCallback(async () => {
    try {
      const cachedRates = localStorage.getItem('pennypal_exchange_rates');
      const cacheTimestamp = localStorage.getItem('pennypal_exchange_rates_timestamp');
      const now = Date.now();
      
      if (cachedRates && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 3600000) {
        setExchangeRates(JSON.parse(cachedRates));
        return;
      }

      const response = await fetch(`${getApiUrl()}/currency/valid?base=USD`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.rates) {
          setExchangeRates(result.data);
          localStorage.setItem('pennypal_exchange_rates', JSON.stringify(result.data));
          localStorage.setItem('pennypal_exchange_rates_timestamp', now.toString());
        }
      }
    } catch (err) {
      console.warn('Failed to fetch exchange rates:', err);
      const cached = localStorage.getItem('pennypal_exchange_rates');
      if (cached) {
        try {
          setExchangeRates(JSON.parse(cached));
        } catch (parseErr) {
          console.warn('Failed to parse cached exchange rates:', parseErr);
        }
      }
    }
  }, [getApiUrl]);

  // Fetch user preferences
  const fetchUserPreferences = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      const saved = localStorage.getItem('pennypal_base_currency');
      if (saved) setBaseCurrency(saved);
      return;
    }
    
    try {
      const token = authService.getToken();
      const response = await fetch(`${getApiUrl()}/user/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.baseCurrency) {
          setBaseCurrency(result.data.baseCurrency);
          localStorage.setItem('pennypal_base_currency', result.data.baseCurrency);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch user preferences:', err);
    }
    
    const saved = localStorage.getItem('pennypal_base_currency');
    if (saved && saved !== baseCurrency) {
      setBaseCurrency(saved);
    }
  }, [getApiUrl, baseCurrency]);

  // Fetch transactions using transactionService
  const fetchTransactions = useCallback(async () => {
    if (!checkAuth()) return;

    try {
      const result = await transactionService.getTransactions();
      
      if (result.success) {
        let transactionData = [];
        
        // Handle different response structures
        if (result.data?.transactions) {
          transactionData = result.data.transactions;
        } else if (Array.isArray(result.data)) {
          transactionData = result.data;
        } else if (result.transactions) {
          transactionData = result.transactions;
        }
        
        const cleanedTransactions = transactionData
          .filter(t => t && !isNaN(parseFloat(t.amount || t.originalAmount)))
          .map(t => {
            const amount = parseFloat(t.amount || t.originalAmount) || 0;
            const timestamp = t.timestamp || t.createdAt || t.date || new Date().toISOString();
            
            return {
              ...t,
              _id: t._id || t.id,
              amount,
              originalAmount: parseFloat(t.originalAmount || t.amount) || amount,
              convertedAmount: t.convertedAmount ? parseFloat(t.convertedAmount) : null,
              timestamp,
              type: (t.type || 'expense').toLowerCase(),
              category: t.category || 'Other',
              currency: t.currency || t.originalCurrency || baseCurrency,
              originalCurrency: t.originalCurrency || t.currency || baseCurrency,
              convertedCurrency: t.convertedCurrency || baseCurrency,
              title: t.title || 'Untitled Transaction',
              description: t.description || '',
              tags: Array.isArray(t.tags) ? t.tags : [],
              source: t.source || 'manual'
            };
          })
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        setTransactions(cleanedTransactions);
        setRecentTransactions(cleanedTransactions.slice(0, 5));
      } else {
        throw new Error(result.message || 'Failed to load transactions');
      }
    } catch (err) {
      console.error('Transaction fetch error:', err);
      setError(err.message || 'Network error - please check your connection');
      setTransactions([]);
      setRecentTransactions([]);
    }
  }, [baseCurrency, checkAuth]);

  // Generate wordcloud from transaction categories and titles
  const generateWordcloud = useCallback(async () => {
    if (transactions.length === 0) return;

    setWordcloudLoading(true);
    try {
      const token = authService.getToken();
      
      // Create text from categories and transaction titles
      const text = transactions
        .map(t => `${t.category} ${t.title}`)
        .join(' ')
        .toLowerCase();

      const response = await fetch(`${getApiUrl()}/wordcloud/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWordcloudData(result.data);
        }
      }
    } catch (err) {
      console.warn('Failed to generate wordcloud:', err);
    } finally {
      setWordcloudLoading(false);
    }
  }, [transactions, getApiUrl]);

  // Calculate dashboard analytics
  const dashboardAnalytics = useMemo(() => {
    if (transactions.length === 0) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = new Date(currentYear, currentMonth - 1);

    // Filter current month transactions
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.timestamp);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Filter last month transactions
    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.timestamp);
      return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
    });

    // Calculate current month totals with proper conversion
    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => {
        const amount = Math.abs(parseFloat(t.originalAmount || t.amount) || 0);
        return sum + convertCurrency(amount, t.originalCurrency || t.currency, baseCurrency);
      }, 0);
    
    const currentExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => {
        const amount = Math.abs(parseFloat(t.originalAmount || t.amount) || 0);
        return sum + convertCurrency(amount, t.originalCurrency || t.currency, baseCurrency);
      }, 0);

    // Calculate last month totals
    const lastIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => {
        const amount = Math.abs(parseFloat(t.originalAmount || t.amount) || 0);
        return sum + convertCurrency(amount, t.originalCurrency || t.currency, baseCurrency);
      }, 0);
    
    const lastExpense = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => {
        const amount = Math.abs(parseFloat(t.originalAmount || t.amount) || 0);
        return sum + convertCurrency(amount, t.originalCurrency || t.currency, baseCurrency);
      }, 0);

    // Calculate changes
    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
    const expenseChange = lastExpense > 0 ? ((currentExpense - lastExpense) / lastExpense) * 100 : 0;

    // Category analysis for current month
    const categoryData = {};
    currentMonthTransactions.forEach(t => {
      if (t.type === 'expense') {
        const category = t.category || 'Other';
        const amount = Math.abs(parseFloat(t.originalAmount || t.amount) || 0);
        const convertedAmount = convertCurrency(amount, t.originalCurrency || t.currency, baseCurrency);
        categoryData[category] = (categoryData[category] || 0) + convertedAmount;
      }
    });

    const expenseCategories = Object.entries(categoryData)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        percentage: currentExpense > 0 ? parseFloat(((amount / currentExpense) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.timestamp);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => {
          const amount = Math.abs(parseFloat(t.originalAmount || t.amount) || 0);
          return sum + convertCurrency(amount, t.originalCurrency || t.currency, baseCurrency);
        }, 0);
      
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
          const amount = Math.abs(parseFloat(t.originalAmount || t.amount) || 0);
          return sum + convertCurrency(amount, t.originalCurrency || t.currency, baseCurrency);
        }, 0);

      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        income,
        expense,
        net: income - expense
      });
    }

    return {
      totalBalance: currentIncome - currentExpense,
      thisMonthIncome: currentIncome,
      thisMonthExpense: currentExpense,
      netFlow: currentIncome - currentExpense,
      incomeChange: parseFloat(incomeChange.toFixed(1)),
      expenseChange: parseFloat(expenseChange.toFixed(1)),
      expenseCategories,
      monthlyTrend,
      transactionCount: currentMonthTransactions.length,
      averageTransaction: currentMonthTransactions.length > 0 ? (currentIncome + currentExpense) / currentMonthTransactions.length : 0
    };
  }, [transactions, convertCurrency, baseCurrency]);

  // Generate quick insights
  const generateQuickInsights = useCallback(() => {
    if (!dashboardAnalytics) return [];

    const insights = [];
    
    // Spending insight
    if (dashboardAnalytics.expenseChange > 10) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Spending Alert',
        message: `Your expenses increased by ${dashboardAnalytics.expenseChange}% this month`
      });
    } else if (dashboardAnalytics.expenseChange < -10) {
      insights.push({
        type: 'success',
        icon: '🎉',
        title: 'Great Savings',
        message: `You reduced expenses by ${Math.abs(dashboardAnalytics.expenseChange)}% this month`
      });
    }

    // Income insight
    if (dashboardAnalytics.incomeChange > 5) {
      insights.push({
        type: 'success',
        icon: '📈',
        title: 'Income Growth',
        message: `Your income grew by ${dashboardAnalytics.incomeChange}% this month`
      });
    }

    // Category insight
    if (dashboardAnalytics.expenseCategories.length > 0) {
      const topCategory = dashboardAnalytics.expenseCategories[0];
      if (topCategory.percentage > 40) {
        insights.push({
          type: 'info',
          icon: '📊',
          title: 'Category Focus',
          message: `${topCategory.name} accounts for ${topCategory.percentage}% of your spending`
        });
      }
    }

    // Cash flow insight
    if (dashboardAnalytics.netFlow < 0) {
      insights.push({
      type: 'warning',
      icon: '💰',
      title: 'Budget Deficit',
      message: <div style={{ textAlign: 'center' }}>Your expenses exceeded income this month</div>
      });
    } else if (dashboardAnalytics.netFlow > dashboardAnalytics.thisMonthIncome * 0.2) {
      insights.push({
      type: 'success',
      icon: '💪',
      title: 'Strong Savings',
      message: <div style={{ textAlign: 'center' }}>You saved more than 20% of your income this month</div>
      });
    }

    return insights.slice(0, 3); // Show max 3 insights
  }, [dashboardAnalytics]);

  // Update insights when analytics change
  useEffect(() => {
    setQuickInsights(generateQuickInsights());
  }, [generateQuickInsights]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!checkAuth()) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchUserPreferences(),
        fetchExchangeRates(),
        fetchTransactions()
      ]);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [checkAuth, fetchUserPreferences, fetchExchangeRates, fetchTransactions]);

  // Initialize dashboard
  useEffect(() => {
    if (checkAuth()) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, checkAuth]);

  // Generate wordcloud when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      generateWordcloud();
    }
  }, [transactions, generateWordcloud]);

  // Chart colors
  const chartColors = {
    income: '#4CAF50',
    expense: '#F44336',
    net: '#2196F3',
    categories: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
  };

  const greetingData = getGreeting();

  if (loading) {
    return (
      <Layout>
        <div className="dashboard">
          <div className="loading-container">
            <RefreshCw className="loading-spinner" />
            <span className="loading-text">Loading your financial dashboard...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-text">
              <div className="greeting-section">
                <h1 className="page-title">
                  {greetingData.emoji} {greetingData.text}
                </h1>
                <p className="page-subtitle">
                  <Clock size={16} />
                  {greetingData.timeBasedTip}
                </p>
              </div>
            </div>
            
            <div className="header-controls">
              <div className="time-info">
                <Calendar size={16} />
                <span>{new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              
              <button
                onClick={fetchDashboardData}
                className="refresh-button"
                disabled={loading}
              >
                <RefreshCw className={`refresh-icon ${loading ? 'spinning' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle className="error-icon" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="close-error">×</button>
          </div>
        )}

        {/* Quick Insights */}
        {quickInsights.length > 0 && (
          <div className="quick-insights">
            {quickInsights.map((insight, index) => (
              <div key={index} className={`insight-card ${insight.type}`}>
                <span className="insight-icon">{insight.icon}</span>
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}



        {!dashboardAnalytics ? (
          <div className="no-data-container">
            <Receipt className="no-data-icon" />
            <h3>Welcome to PennyPal!</h3>
            <p>Start by adding your first transaction to see your financial dashboard come to life.</p>
            <div className="welcome-actions">
              <button 
                onClick={() => window.location.href = '/transaction'}
                className="welcome-button primary"
              >
                <Plus className="button-icon" />
                Add First Transaction
              </button>
              <button 
                onClick={fetchDashboardData}
                className="welcome-button secondary"
              >
                <RefreshCw className="button-icon" />
                Refresh Data
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="summary-cards">
              <div className="summary-card balance-card">
                <div className="card-content">
                  <div className="card-info">
                    <p className="card-label">Net Balance</p>
                    <p className={`card-value ${dashboardAnalytics.totalBalance >= 0 ? 'positive' : 'negative'}`}>
                      {formatShortCurrency(dashboardAnalytics.totalBalance)}
                    </p>
                    <p className="card-change">
                      <Activity className="change-icon" size={14} />
                      This Month • {baseCurrency}
                    </p>
                  </div>
                  <div className="card-icon balance-icon">
                    <Wallet className="icon" />
                  </div>
                </div>
              </div>

              <div className="summary-card income-card">
                <div className="card-content">
                  <div className="card-info">
                    <p className="card-label">This Month Income</p>
                    <p className="card-value income">
                      {formatShortCurrency(dashboardAnalytics.thisMonthIncome)}
                    </p>
                    <p className={`card-change ${parseFloat(dashboardAnalytics.incomeChange) >= 0 ? 'positive' : 'negative'}`}>
                      <ArrowUp className="change-icon" size={14} />
                      {dashboardAnalytics.incomeChange}% from last month
                    </p>
                  </div>
                  <div className="card-icon income-icon">
                    <TrendingUp className="icon" />
                  </div>
                </div>
              </div>

              <div className="summary-card expense-card">
                <div className="card-content">
                  <div className="card-info">
                    <p className="card-label">This Month Expenses</p>
                    <p className="card-value expense">
                      {formatShortCurrency(dashboardAnalytics.thisMonthExpense)}
                    </p>
                    <p className={`card-change ${parseFloat(dashboardAnalytics.expenseChange) <= 0 ? 'positive' : 'negative'}`}>
                      <ArrowUp className="change-icon" size={14} />
                      {dashboardAnalytics.expenseChange}% from last month
                    </p>
                  </div>
                  <div className="card-icon expense-icon">
                    <TrendingDown className="icon" />
                  </div>
                </div>
              </div>

              <div className="summary-card transaction-card">
                <div className="card-content">
                  <div className="card-info">
                    <p className="card-label">Transactions</p>
                    <p className="card-value">{dashboardAnalytics.transactionCount}</p>
                    <p className="card-change">
                      <Activity className="change-icon" size={14} />
                      Avg: {formatShortCurrency(dashboardAnalytics.averageTransaction)}
                    </p>
                  </div>
                  <div className="card-icon transaction-icon">
                    <Receipt className="icon" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
              {/* Monthly Trend Chart */}
              <div className="dashboard-card chart-card">
                <div className="card-header">
                  <h3 className="card-title">
                    <BarChart3 size={20} />
                    Monthly Trend (6 Months)
                  </h3>
                  <button className="card-action">
                    <MoreHorizontal className="action-icon" />
                  </button>
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dashboardAnalytics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatShortCurrency(value)}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value), name]}
                        labelStyle={{ color: '#333' }}
                        contentStyle={{ 
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stackId="1"
                        stroke={chartColors.income}
                        fill={chartColors.income}
                        fillOpacity={0.6}
                        name="Income"
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        stackId="2"
                        stroke={chartColors.expense}
                        fill={chartColors.expense}
                        fillOpacity={0.6}
                        name="Expenses"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense Categories */}
              <div className="dashboard-card chart-card">
                <div className="card-header">
                  <h3 className="card-title">
                    <PieChartIcon size={20} />
                    Expense Categories
                  </h3>
                  <button 
                    className="card-action"
                    onClick={() => window.location.href = '/analytic?view=category'}
                  >
                    <Eye className="action-icon" />
                  </button>
                </div>
                <div className="chart-container">
                  {dashboardAnalytics.expenseCategories.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={dashboardAnalytics.expenseCategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percentage }) => `${name} (${percentage}%)`}
                          labelLine={false}
                        >
                          {dashboardAnalytics.expenseCategories.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={chartColors.categories[index % chartColors.categories.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value), 'Amount']}
                          contentStyle={{ 
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="chart-no-data">
                      <PieChartIcon size={48} className="no-data-icon" />
                      <p>No expense data available</p>
                      <span className="no-data-hint">Add some expenses to see categories</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">
                    <Receipt size={20} />
                    Recent Transactions
                  </h3>
                  <button 
                    className="card-action"
                    onClick={() => window.location.href = '/transaction'}
                  >
                    View All
                  </button>
                </div>
                <div className="transactions-list">
                  {recentTransactions.length === 0 ? (
                    <div className="empty-state">
                      <Receipt className="empty-icon" />
                      <p>No recent transactions</p>
                      <button 
                        className="add-transaction-btn"
                        onClick={() => window.location.href = '/transaction'}
                      >
                        <Plus size={16} />
                        Add Your First Transaction
                      </button>
                    </div>
                  ) : (
                    recentTransactions.map(transaction => (
                      <div key={transaction._id} className="transaction-item">
                        <div className="transaction-icon">
                          <div className={`icon-wrapper ${transaction.type}`}>
                            {transaction.type === 'income' ? 
                              <ArrowDown className="transaction-arrow income" size={16} /> : 
                              <ArrowUp className="transaction-arrow expense" size={16} />
                            }
                          </div>
                        </div>
                        
                        <div className="transaction-details">
                          <p className="transaction-title">{transaction.title}</p>
                          <p className="transaction-meta">
                            <span className="category">{transaction.category}</span>
                            <span className="separator">•</span>
                            <span className="date">
                              {new Date(transaction.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </p>
                        </div>
                        
                        <div className="transaction-amount">
                          <p className={`amount ${transaction.type}`}>
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(
                              convertCurrency(
                                Math.abs(parseFloat(transaction.originalAmount || transaction.amount) || 0), 
                                transaction.originalCurrency || transaction.currency, 
                                baseCurrency
                              ), 
                              baseCurrency
                            )}
                          </p>
                          {(transaction.originalCurrency || transaction.currency) !== baseCurrency && (
                            <p className="original-currency">
                              {formatCurrency(
                                Math.abs(parseFloat(transaction.originalAmount || transaction.amount) || 0), 
                                transaction.originalCurrency || transaction.currency
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Financial Insights & Wordcloud */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">
                    <Cloud size={20} />
                    Spending Insights
                  </h3>
                  <button 
                    className="card-action"
                    onClick={generateWordcloud}
                    disabled={wordcloudLoading}
                  >
                    {wordcloudLoading ? <RefreshCw className="spinning" size={16} /> : 'Refresh'}
                  </button>
                </div>
                <div className="insights-container">
                  {wordcloudLoading ? (
                    <div className="wordcloud-loading">
                      <RefreshCw className="loading-spinner" />
                      <p>Generating insights...</p>
                    </div>
                  ) : wordcloudData ? (
                    <div className="wordcloud-section">
                      <div className="wordcloud-image">
                        {wordcloudData.image_url ? (
                          <img 
                            src={wordcloudData.image_url} 
                            alt="Spending Wordcloud" 
                            className="wordcloud-img"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <div className="wordcloud-fallback" style={{ display: 'none' }}>
                          <Cloud size={48} />
                          <p>Wordcloud visualization</p>
                        </div>
                      </div>
                      <div className="wordcloud-info">
                        <p className="wordcloud-description">
                          Visual representation of your spending patterns and categories
                        </p>
                        {dashboardAnalytics.expenseCategories.length > 0 && (
                          <div className="top-categories">
                            <h5>Top Categories:</h5>
                            <div className="category-tags">
                              {dashboardAnalytics.expenseCategories.slice(0, 3).map((cat, index) => (
                                <span key={index} className="category-tag">
                                  {cat.name} ({cat.percentage}%)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="insights-no-data">
                      <Cloud size={48} className="no-data-icon" />
                      <p>No insights available</p>
                      <span className="no-data-hint">Add more transactions to generate insights</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Progress */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">
                    <Target size={20} />
                    Monthly Progress
                  </h3>
                  <button className="card-action">
                    <MoreHorizontal className="action-icon" />
                  </button>
                </div>
                <div className="progress-container">
                  {/* Days Progress */}
                  <div className="progress-item">
                    <div className="progress-header">
                      <div className="progress-info">
                        <p className="progress-label">Month Progress</p>
                        <p className="progress-amount">
                          {new Date().getDate()} / {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} days
                        </p>
                      </div>
                      <div className="progress-percentage">
                        {Math.round((new Date().getDate() / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) * 100)}%
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill month"
                        style={{ 
                          width: `${(new Date().getDate() / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Transaction Goal */}
                  <div className="progress-item">
                    <div className="progress-header">
                      <div className="progress-info">
                        <p className="progress-label">Transaction Goal</p>
                        <p className="progress-amount">
                          {dashboardAnalytics.transactionCount} / 50 transactions
                        </p>
                      </div>
                      <div className="progress-percentage">
                        {Math.min(Math.round((dashboardAnalytics.transactionCount / 50) * 100), 100)}%
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${dashboardAnalytics.transactionCount >= 50 ? 'complete' : 'transactions'}`}
                        style={{ 
                          width: `${Math.min((dashboardAnalytics.transactionCount / 50) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Savings Rate */}
                  {dashboardAnalytics.thisMonthIncome > 0 && (
                    <div className="progress-item">
                      <div className="progress-header">
                        <div className="progress-info">
                          <p className="progress-label">Savings Rate</p>
                          <p className="progress-amount">
                            {formatShortCurrency(dashboardAnalytics.netFlow)} saved
                          </p>
                        </div>
                        <div className="progress-percentage">
                          {Math.round((dashboardAnalytics.netFlow / dashboardAnalytics.thisMonthIncome) * 100)}%
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${
                            (dashboardAnalytics.netFlow / dashboardAnalytics.thisMonthIncome) * 100 >= 20 ? 'savings-good' : 
                            (dashboardAnalytics.netFlow / dashboardAnalytics.thisMonthIncome) * 100 >= 0 ? 'savings-ok' : 'savings-bad'
                          }`}
                          style={{ 
                            width: `${Math.min(Math.abs((dashboardAnalytics.netFlow / dashboardAnalytics.thisMonthIncome) * 100), 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;