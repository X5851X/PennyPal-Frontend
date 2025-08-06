import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/transaction';

const SpendingInsights = ({ transactions = [] }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateInsights = async () => {
    if (!transactions || transactions.length === 0) {
      setError('No transactions available for analysis');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare expense data for AI analysis
      const expenseData = transactions
        .filter(t => t.type === 'expense')
        .slice(0, 20) // Limit to recent 20 transactions
        .map(t => ({
          description: t.title || t.description,
          amount: t.amount,
          category: t.category,
          date: t.timestamp || t.createdAt
        }));

      if (expenseData.length === 0) {
        setError('No expense transactions found for analysis');
        return;
      }

      const result = await transactionService.analyzeSpendingPatterns(expenseData);
      
      if (result.success) {
        setInsights(result.data);
      } else {
        setError('Failed to analyze spending patterns');
      }
    } catch (err) {
      setError('Unable to generate insights at the moment');
      console.error('Spending analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTopCategories = () => {
    if (!transactions || transactions.length === 0) return [];
    
    const categoryTotals = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = t.category || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + (t.amount || 0);
      });

    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
  };

  const getTotalExpenses = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  const topCategories = getTopCategories();
  const totalExpenses = getTotalExpenses();

  return (
    <div className="spending-insights-container">
      <div className="insights-header">
        <h3>📊 Spending Insights</h3>
        <button
          onClick={generateInsights}
          disabled={loading || transactions.length === 0}
          className="generate-insights-btn"
        >
          {loading ? '🔄 Analyzing...' : '🤖 Generate AI Insights'}
        </button>
      </div>

      {error && (
        <div className="insights-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="insights-grid">
        {/* Quick Stats */}
        <div className="insight-card stats-card">
          <h4>📈 Quick Stats</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Expenses</span>
              <span className="stat-value expense">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Transactions</span>
              <span className="stat-value">{transactions.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Categories</span>
              <span className="stat-value">{topCategories.length}</span>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="insight-card categories-card">
          <h4>🏆 Top Spending Categories</h4>
          <div className="categories-list">
            {topCategories.map((item, index) => (
              <div key={item.category} className="category-item">
                <div className="category-info">
                  <span className="category-rank">#{index + 1}</span>
                  <span className="category-name">{item.category}</span>
                </div>
                <span className="category-amount">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        {insights && (
          <div className="insight-card ai-insights-card">
            <h4>🤖 AI Analysis</h4>
            <div className="ai-insights-content">
              {insights.summary && (
                <div className="insight-section">
                  <h5>📝 Summary</h5>
                  <p>{insights.summary}</p>
                </div>
              )}
              
              {insights.keywords && insights.keywords.length > 0 && (
                <div className="insight-section">
                  <h5>🔍 Key Patterns</h5>
                  <div className="keywords-list">
                    {insights.keywords.slice(0, 8).map((keyword, index) => (
                      <span key={index} className="keyword-tag">{keyword}</span>
                    ))}
                  </div>
                </div>
              )}

              {insights.sentiment && (
                <div className="insight-section">
                  <h5>💭 Spending Sentiment</h5>
                  <div className={`sentiment-indicator ${insights.sentiment.toLowerCase()}`}>
                    {insights.sentiment === 'positive' && '😊 Positive'}
                    {insights.sentiment === 'negative' && '😟 Concerning'}
                    {insights.sentiment === 'neutral' && '😐 Neutral'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tips Card */}
        <div className="insight-card tips-card">
          <h4>💡 Smart Tips</h4>
          <div className="tips-list">
            <div className="tip-item">
              <span className="tip-icon">🎯</span>
              <span className="tip-text">Track your largest expense category more closely</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">📱</span>
              <span className="tip-text">Use receipt scanning for accurate tracking</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🤖</span>
              <span className="tip-text">Let AI categorize your expenses automatically</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">📊</span>
              <span className="tip-text">Review your spending patterns weekly</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingInsights;