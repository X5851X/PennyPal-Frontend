import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '../../components/layout';
import { authService } from '../../services/auth';
import { transactionService } from '../../services/transaction';
import SpendingInsights from '../../components/spending/SpendingInsights';
import '../../components/spending/SpendingInsights.css';
import './analytic.css';

const Analytics = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [viewMode, setViewMode] = useState('yearly');
  const [baseCurrency, setBaseCurrency] = useState(() => {
    return localStorage.getItem('pennypal_base_currency') || 'IDR';
  });

  // Simplified user preferences fetching
  const fetchUserPreferences = useCallback(async () => {
    const saved = localStorage.getItem('pennypal_base_currency');
    if (saved) {
      setBaseCurrency(saved);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setError('Please login to continue');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await transactionService.getTransactions();
      
      if (result.success) {
        let transactionData = [];
        
        if (result.data?.transactions) {
          transactionData = result.data.transactions;
        } else if (Array.isArray(result.data)) {
          transactionData = result.data;
        } else if (result.transactions) {
          transactionData = result.transactions;
        }
        
        const cleanedTransactions = transactionData
          .filter(t => t && !isNaN(parseFloat(t.amount)))
          .map(t => {
            const transactionDate = new Date(t.timestamp || t.createdAt);
            return {
              ...t,
              amount: parseFloat(t.amount) || 0,
              timestamp: t.timestamp || t.createdAt || new Date().toISOString(),
              type: (t.type || 'expense').toLowerCase(),
              category: t.category || 'Other',
              currency: t.currency || 'IDR',
              title: t.title || 'Untitled Transaction',
              description: t.description || '',
              tags: Array.isArray(t.tags) ? t.tags : [],
              source: t.source || 'manual',
              year: transactionDate.getFullYear(),
              month: transactionDate.getMonth(),
              day: transactionDate.getDate()
            };
          });
        
        setTransactions(cleanedTransactions);
      } else {
        setError(result.message || 'Failed to load transactions');
        setTransactions([]);
      }
    } catch (err) {
      setError(err.response?.status === 401 ? 'Please login again' : 'Network error');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const convertCurrency = useMemo(() => {
    return (amount, fromCurrency, toCurrency) => {
      if (fromCurrency === toCurrency) return amount;
      
      const rates = {
        USD: 1, IDR: 15000, KRW: 1300, EUR: 0.92, JPY: 150,
        SGD: 1.34, MYR: 4.7, AUD: 1.5, GBP: 0.79, CHF: 0.88, CAD: 1.36
      };
      
      if (!rates[fromCurrency] || !rates[toCurrency]) return amount;
      
      const usdAmount = amount / rates[fromCurrency];
      return Math.round((usdAmount * rates[toCurrency]) * 100) / 100;
    };
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        if (t.year !== selectedYear) return false;
        if (selectedMonth !== null && t.month !== selectedMonth) return false;
        return true;
      })
      .map(t => ({
        ...t,
        convertedAmount: convertCurrency(t.amount, t.currency, baseCurrency)
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [transactions, selectedYear, selectedMonth, baseCurrency, convertCurrency]);

  const analyticsData = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return {
        totalIncome: 0, totalExpense: 0, netSavings: 0, totalTransactions: 0,
        incomeTransactions: 0, expenseTransactions: 0, averageIncome: 0,
        averageExpense: 0, incomeGrowth: 0, expenseGrowth: 0, savingsRate: 0,
        largestIncome: 0, largestExpense: 0, dailyAverage: 0
      };
    }

    const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.convertedAmount), 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.convertedAmount), 0);
    
    const largestIncome = incomeTransactions.length > 0 ? 
      Math.max(...incomeTransactions.map(t => Math.abs(t.convertedAmount))) : 0;
    const largestExpense = expenseTransactions.length > 0 ? 
      Math.max(...expenseTransactions.map(t => Math.abs(t.convertedAmount))) : 0;

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      totalIncome, totalExpense, netSavings,
      totalTransactions: filteredTransactions.length,
      incomeTransactions: incomeTransactions.length,
      expenseTransactions: expenseTransactions.length,
      averageIncome: incomeTransactions.length > 0 ? totalIncome / incomeTransactions.length : 0,
      averageExpense: expenseTransactions.length > 0 ? totalExpense / expenseTransactions.length : 0,
      incomeGrowth: 0, expenseGrowth: 0, savingsRate, largestIncome, largestExpense,
      dailyAverage: (totalIncome + totalExpense) / 30
    };
  }, [filteredTransactions]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yearTransactions = transactions.filter(t => t.year === selectedYear);

    return months.map((month, index) => {
      const monthTransactions = yearTransactions.filter(t => t.month === index);
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(convertCurrency(t.amount, t.currency, baseCurrency)), 0);
      
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(convertCurrency(t.amount, t.currency, baseCurrency)), 0);
      
      return {
        month, monthIndex: index, income, expense, net: income - expense,
        count: monthTransactions.length,
        averageDaily: (income + expense) / new Date(selectedYear, index + 1, 0).getDate(),
        incomeTransactions: monthTransactions.filter(t => t.type === 'income').length,
        expenseTransactions: monthTransactions.filter(t => t.type === 'expense').length
      };
    });
  }, [transactions, selectedYear, baseCurrency, convertCurrency]);

  const categoryData = useMemo(() => {
    const categories = {};
    
    filteredTransactions.forEach(t => {
      const category = t.category || 'Other';
      if (!categories[category]) {
        categories[category] = { totalAmount: 0, count: 0, income: 0, expense: 0 };
      }
      
      const amount = Math.abs(t.convertedAmount);
      categories[category].count += 1;
      categories[category].totalAmount += amount;
      
      if (t.type === 'income') {
        categories[category].income += amount;
      } else {
        categories[category].expense += amount;
      }
    });

    const totalSpending = Object.values(categories).reduce((sum, cat) => sum + cat.totalAmount, 0);

    return Object.entries(categories).map(([category, data]) => ({
      category,
      totalAmount: data.totalAmount,
      count: data.count,
      income: data.income,
      expense: data.expense,
      averageAmount: data.totalAmount / data.count,
      percentage: totalSpending > 0 ? (data.totalAmount / totalSpending) * 100 : 0,
      trend: 0
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredTransactions]);

  const topExpenseCategory = useMemo(() => {
    const expenseCategories = {};
    
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = t.category || 'Other';
        if (!expenseCategories[category]) {
          expenseCategories[category] = { totalAmount: 0, count: 0 };
        }
        expenseCategories[category].totalAmount += Math.abs(t.convertedAmount);
        expenseCategories[category].count += 1;
      });

    const totalExpenseAmount = Object.values(expenseCategories).reduce((sum, cat) => sum + cat.totalAmount, 0);
    
    const sortedCategories = Object.entries(expenseCategories)
      .map(([category, data]) => ({
        category,
        totalAmount: data.totalAmount,
        count: data.count,
        percentage: totalExpenseAmount > 0 ? (data.totalAmount / totalExpenseAmount) * 100 : 0
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
    
    return sortedCategories[0] || null;
  }, [filteredTransactions]);

  // Effects
  useEffect(() => {
    fetchUserPreferences();
  }, [fetchUserPreferences]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const formatCurrency = useCallback((amount) => {
    const currencySymbols = {
      IDR: 'Rp', USD: '$', EUR: '€', JPY: '¥', SGD: 'S$', MYR: 'RM',
      AUD: 'A$', GBP: '£', CHF: 'CHF', CAD: 'C$', KRW: '₩'
    };
    
    const symbol = currencySymbols[baseCurrency] || baseCurrency;
    const numAmount = parseFloat(amount) || 0;
    
    if (['IDR', 'KRW', 'JPY'].includes(baseCurrency)) {
      return `${symbol} ${Math.round(numAmount).toLocaleString()}`;
    }
    return `${symbol} ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [baseCurrency]);

  const formatPercentage = useCallback((value) => {
    if (isNaN(value)) return '0%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }, []);

  return (
    <Layout>
      <div className="analytics-container">
        <div className="analytics-header">
          <div className="header-content">
            <h1>📊 Financial Analytics</h1>
            <p className="header-subtitle">Track your spending patterns and financial insights</p>
          </div>
          <div className="header-actions">
            <div className="controls">
            <input 
              type="number"
              value={selectedYear}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setSelectedYear('');
                } else {
                  const year = parseInt(value);
                  if (!isNaN(year)) {
                    setSelectedYear(year);
                  }
                }
              }}
              onBlur={(e) => {
                const year = parseInt(e.target.value);
                if (isNaN(year) || year < 2000 || year > new Date().getFullYear() + 1) {
                  setSelectedYear(new Date().getFullYear());
                }
              }}
              min="2000"
              max={new Date().getFullYear() + 1}
              placeholder={new Date().getFullYear()}
            />
            
            {viewMode === 'monthly' && (
              <select 
                value={selectedMonth || ''} 
                onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">All Months</option>
                {monthlyData.map((month, index) => (
                  <option key={index} value={index}>{month.month}</option>
                ))}
              </select>
            )}
            
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="yearly">📅 Yearly</option>
              <option value="monthly">📊 Monthly</option>
              <option value="category">📂 By Category</option>
              <option value="insights">💡 Insights</option>
            </select>
            
              <div className="currency-info">
                <span>💱 {baseCurrency}</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>📊 Loading analytics data...</p>
          </div>
        ) : (
          <div className="analytics-content">
            {viewMode === 'yearly' && (
              <div className="yearly-analytics">
                <div className="summary-cards">
                  <div className="summary-card income">
                    <div className="card-icon">💵</div>
                    <div className="card-content">
                      <h3>Total Income</h3>
                      <p className="amount">{formatCurrency(analyticsData.totalIncome || 0)}</p>
                      <div className="card-details">
                        <span className="period">{selectedYear}</span>
                        <span className={`growth ${analyticsData.incomeGrowth >= 0 ? 'positive' : 'negative'}`}>
                          {formatPercentage(analyticsData.incomeGrowth)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="summary-card expense">
                    <div className="card-icon">💸</div>
                    <div className="card-content">
                      <h3>Total Expense</h3>
                      <p className="amount">{formatCurrency(analyticsData.totalExpense || 0)}</p>
                      <div className="card-details">
                        <span className="period">{selectedYear}</span>
                        <span className={`growth ${analyticsData.expenseGrowth <= 0 ? 'positive' : 'negative'}`}>
                          {formatPercentage(analyticsData.expenseGrowth)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="summary-card savings">
                    <div className="card-icon">💰</div>
                    <div className="card-content">
                      <h3>Net Savings</h3>
                      <p className={`amount ${analyticsData.netSavings >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(analyticsData.netSavings || 0)}
                      </p>
                      <div className="card-details">
                        <span className="period">{selectedYear}</span>
                        <span className="savings-rate">
                          Rate: {formatPercentage(analyticsData.savingsRate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="summary-card transactions">
                    <div className="card-icon">📊</div>
                    <div className="card-content">
                      <h3>Transactions</h3>
                      <p className="amount">{analyticsData.totalTransactions || 0}</p>
                      <div className="card-details">
                        <span className="detail">{analyticsData.incomeTransactions} income</span>
                        <span className="detail">{analyticsData.expenseTransactions} expense</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional insight cards */}
                <div className="insight-cards">
                  <div className="insight-card">
                    <div className="insight-header">
                      <span className="insight-icon">📈</span>
                      <h4>Daily Average</h4>
                    </div>
                    <p className="insight-value">{formatCurrency(analyticsData.dailyAverage)}</p>
                  </div>

                  <div className="insight-card">
                    <div className="insight-header">
                      <span className="insight-icon">🏆</span>
                      <h4>Largest Income</h4>
                    </div>
                    <p className="insight-value">{formatCurrency(analyticsData.largestIncome)}</p>
                  </div>

                  <div className="insight-card">
                    <div className="insight-header">
                      <span className="insight-icon">⚠️</span>
                      <h4>Largest Expense</h4>
                    </div>
                    <p className="insight-value">{formatCurrency(analyticsData.largestExpense)}</p>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'monthly' && (
              <div className="monthly-analytics">
                <h3>📊 Monthly Breakdown - {selectedYear}</h3>
                <div className="chart-container">
                  <div className="bar-chart">
                    {monthlyData.map((month, index) => {
                      const maxAmount = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)));
                      return (
                        <div key={index} className={`month-bar ${selectedMonth === index ? 'selected' : ''}`}>
                          <div className="bars">
                            <div 
                              className="bar income-bar" 
                              style={{ height: `${maxAmount > 0 ? (month.income / maxAmount) * 200 : 0}px` }}
                              title={`Income: ${formatCurrency(month.income)}`}
                            />
                            <div 
                              className="bar expense-bar" 
                              style={{ height: `${maxAmount > 0 ? (month.expense / maxAmount) * 200 : 0}px` }}
                              title={`Expense: ${formatCurrency(month.expense)}`}
                            />
                          </div>
                          <div className="month-label">{month.month}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="monthly-grid">
                  {monthlyData.map((month, index) => (
                    <div 
                      key={index} 
                      className={`month-card ${selectedMonth === index ? 'selected' : ''}`}
                      onClick={() => setSelectedMonth(selectedMonth === index ? null : index)}
                    >
                      <div className="month-header">
                        <h4>{month.month}</h4>
                        <span className="transaction-count">{month.count} transactions</span>
                      </div>
                      <div className="month-stats">
                        <div className="stat-item income">
                          <span className="stat-label">💵 Income</span>
                          <span className="stat-value">{formatCurrency(month.income || 0)}</span>
                        </div>
                        <div className="stat-item expense">
                          <span className="stat-label">💸 Expense</span>
                          <span className="stat-value">{formatCurrency(month.expense || 0)}</span>
                        </div>
                        <div className="stat-item net">
                          <span className="stat-label">💰 Net</span>
                          <span className={`stat-value ${month.net >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(month.net || 0)}
                          </span>
                        </div>
                        <div className="stat-item average">
                          <span className="stat-label">📊 Daily Avg</span>
                          <span className="stat-value">{formatCurrency(month.averageDaily || 0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'category' && (
              <div className="category-analytics">
                <h3>📂 Category Analysis - {selectedYear}</h3>
                <div className="chart-container">
                  <div className="pie-chart">
                    {categoryData.slice(0, 8).map((category, index) => {
                      const colors = [
                        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
                        '#FFEAA7', '#DDA0DD', '#F7DC6F', '#BB8FCE'
                      ];
                      return (
                        <div key={index} className="pie-segment">
                          <div 
                            className="pie-color" 
                            style={{ backgroundColor: colors[index % colors.length] }}
                          />
                          <div className="pie-info">
                            <div className="pie-category">{category.category}</div>
                            <div className="pie-amount">{formatCurrency(category.totalAmount)}</div>
                            <div className="pie-percentage">{category.percentage.toFixed(1)}%</div>
                          </div>
                          <div className="pie-trend">
                            <span className={`trend-indicator ${category.trend >= 0 ? 'up' : 'down'}`}>
                              {category.trend >= 0 ? '📈' : '📉'} {formatPercentage(category.trend)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="category-grid">
                  {categoryData.map((category, index) => (
                    <div key={index} className="category-card">
                      <div className="category-header">
                        <h4>{category.category}</h4>
                        <div className="category-meta">
                          <span className="transaction-count">{category.count} transactions</span>
                          <span className="category-percentage">{category.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className="category-stats">
                        <div className="stat-item">
                          <span className="stat-label">💸 Total Spent</span>
                          <span className="stat-value">{formatCurrency(category.totalAmount || 0)}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">📊 Average</span>
                          <span className="stat-value">{formatCurrency(category.averageAmount || 0)}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">📈 Trend</span>
                          <span className={`stat-value ${category.trend >= 0 ? 'negative' : 'positive'}`}>
                            {formatPercentage(category.trend)}
                          </span>
                        </div>
                      </div>

                      {category.income > 0 && (
                        <div className="category-income">
                          <span className="income-label">💵 Income: </span>
                          <span className="income-value">{formatCurrency(category.income)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'insights' && (
              <div className="insights-analytics">
                <h3>💡 Financial Insights - {selectedYear}</h3>
                
                {/* AI-Powered Spending Insights */}
                <SpendingInsights transactions={filteredTransactions} />
                
                <div className="insights-grid">
                  <div className="insight-section">
                    <div className="section-header">
                      <h4>🔍 Spending Patterns</h4>
                    </div>
                    <div className="insights-list">
                      <div className="insight-item">
                        <span className="insight-icon">💰</span>
                        <div className="insight-content">
                          <h5>Savings Rate</h5>
                          <p>
                            You're {analyticsData.savingsRate >= 0 ? 'saving' : 'spending'} <strong>{formatPercentage(Math.abs(analyticsData.savingsRate))}</strong> {analyticsData.savingsRate >= 0 ? 'of your income' : 'more than your income'}.
                            {analyticsData.savingsRate >= 20 ? ' Great job! 🎉' : 
                             analyticsData.savingsRate >= 10 ? ' Good progress! 👍' :
                             analyticsData.savingsRate >= 0 ? ' Consider saving more 💪' : ' Need to reduce expenses 🚨'}
                          </p>
                        </div>
                      </div>

                      <div className="insight-item">
                        <span className="insight-icon">📊</span>
                        <div className="insight-content">
                          <h5>Transaction Summary</h5>
                          <p>
                            You have <strong>{analyticsData.totalTransactions}</strong> transactions this year.
                            <br />
                            Income: <strong>{analyticsData.incomeTransactions}</strong>, 
                            Expense: <strong>{analyticsData.expenseTransactions}</strong>
                          </p>
                        </div>
                      </div>

                      {topExpenseCategory && (
                        <div className="insight-item">
                          <span className="insight-icon">🎯</span>
                          <div className="insight-content">
                            <h5>Top Spending Category</h5>
                            <p>
                              Your highest spending category is <strong>{topExpenseCategory.category}</strong> 
                              with {formatCurrency(topExpenseCategory.totalAmount)}, 
                              making up {topExpenseCategory.percentage.toFixed(1)}% of total expenses.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {filteredTransactions.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No data available for {selectedYear}</h3>
                <p>
                  {transactions.length > 0 
                    ? `You have ${transactions.length} transactions, but none match the selected year ${selectedYear}. Try selecting a different year.`
                    : 'Start adding transactions to see your enhanced analytics'
                  }
                </p>
                <div className="empty-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => window.location.href = '/transaction'}
                  >
                    ➕ Add Transaction
                  </button>
                  {transactions.length > 0 && (
                    <button 
                      className="btn-secondary"
                      onClick={() => setSelectedYear(new Date().getFullYear())}
                    >
                      🔄 Reset to Current Year
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Analytics;