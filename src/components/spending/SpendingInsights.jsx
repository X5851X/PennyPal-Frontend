import React, { useState, useMemo, useCallback } from 'react';

// Internationalization strings
const i18n = {
  title: '📊 Spending Insights',
  generateBtn: '🧠 Generate Insights',
  analyzing: '🔄 Analyzing...',
  quickStats: '📈 Quick Stats',
  totalExpenses: 'Total Expenses',
  transactions: 'Transactions',
  categories: 'Categories',
  topCategories: '🏆 Top Spending Categories',
  aiAnalysis: '🤖 AI Analysis',
  summary: '📝 Summary',
  keyPatterns: '🔍 Key Patterns',
  sentiment: '💭 Spending Sentiment',
  smartTips: '💡 Smart Tips',
  tips: {
    track: 'Track your largest expense category more closely',
    scan: 'Use receipt scanning for accurate tracking',
    ai: 'Let AI categorize your expenses automatically',
    review: 'Review your spending patterns weekly'
  },
  sentiments: {
    positive: '😊 Positive',
    negative: '😟 Concerning',
    neutral: '😐 Neutral'
  },
  errors: {
    noTransactions: 'No transactions available for analysis',
    noExpenses: 'No expense transactions found for analysis',
    generateFailed: 'Unable to generate insights'
  }
};

const SpendingInsights = ({ transactions = [] }) => {
  const [baseCurrency, setBaseCurrency] = useState(() => {
    try {
      return localStorage.getItem('pennypal_base_currency') || 'IDR';
    } catch (error) {
      console.warn('localStorage not available:', error);
      return 'IDR';
    }
  });
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCurrency = (amount) => {
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
  };

  const generateInsights = useCallback(() => {
    if (!transactions || transactions.length === 0) {
      setError(i18n.errors.noTransactions);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate frontend-only insights
      const expenseTransactions = transactions.filter(t => t.type === 'expense');
      
      if (expenseTransactions.length === 0) {
        setError(i18n.errors.noExpenses);
        setLoading(false);
        return;
      }

      // Analyze spending patterns locally
      const categoryFrequency = {};
      const keywords = new Set();
      let totalAmount = 0;

      expenseTransactions.forEach(t => {
        const category = t.category || 'Other';
        categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
        totalAmount += t.convertedAmount || t.amount || 0;
        
        // Extract keywords from titles/descriptions
        const text = (t.title || t.description || '').toLowerCase();
        const words = text.split(/\s+/).filter(word => word.length > 3);
        words.forEach(word => keywords.add(word));
      });

      // Generate insights with error handling
      const categoryEntries = Object.entries(categoryFrequency);
      if (categoryEntries.length === 0) {
        throw new Error('No categories found');
      }
      
      const topCategory = categoryEntries
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';
      
      const avgAmount = expenseTransactions.length > 0 ? totalAmount / expenseTransactions.length : 0;
      const sentiment = avgAmount > 100000 ? 'negative' : avgAmount > 50000 ? 'neutral' : 'positive';
      
      const summary = `You have ${expenseTransactions.length} expense transactions with an average of ${formatCurrency(avgAmount)}. Your top spending category is ${topCategory}.`;

      setInsights({
        summary,
        keywords: Array.from(keywords).slice(0, 8),
        sentiment,
        topCategory,
        averageAmount: avgAmount
      });
    } catch (err) {
      console.error('Insight generation error:', err);
      setError(i18n.errors.generateFailed);
    } finally {
      setLoading(false);
    }
  }, [transactions]);

  const topCategories = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const categoryTotals = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = t.category || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + (t.convertedAmount || t.amount || 0);
      });

    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.convertedAmount || t.amount || 0), 0);
  }, [transactions]);

  return (
    <div className="spending-insights-container">
      <div className="insights-header">
        <h3>{i18n.title}</h3>
        <button
          onClick={generateInsights}
          disabled={loading || transactions.length === 0}
          className="generate-insights-btn"
        >
          {loading ? i18n.analyzing : i18n.generateBtn}
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
          <h4>{i18n.quickStats}</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">{i18n.totalExpenses}</span>
              <span className="stat-value expense">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{i18n.transactions}</span>
              <span className="stat-value">{transactions.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{i18n.categories}</span>
              <span className="stat-value">{topCategories.length}</span>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="insight-card categories-card">
          <h4>{i18n.topCategories}</h4>
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
            <h4>{i18n.aiAnalysis}</h4>
            <div className="ai-insights-content">
              {insights.summary && (
                <div className="insight-section">
                  <h5>{i18n.summary}</h5>
                  <p>{insights.summary}</p>
                </div>
              )}
              
              {insights.keywords && insights.keywords.length > 0 && (
                <div className="insight-section">
                  <h5>{i18n.keyPatterns}</h5>
                  <div className="keywords-list">
                    {insights.keywords.slice(0, 8).map((keyword, index) => (
                      <span key={index} className="keyword-tag">{keyword}</span>
                    ))}
                  </div>
                </div>
              )}

              {insights.sentiment && (
                <div className="insight-section">
                  <h5>{i18n.sentiment}</h5>
                  <div className={`sentiment-indicator ${insights.sentiment.toLowerCase()}`}>
                    {i18n.sentiments[insights.sentiment] || insights.sentiment}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tips Card */}
        <div className="insight-card tips-card">
          <h4>{i18n.smartTips}</h4>
          <div className="tips-list">
            <div className="tip-item">
              <span className="tip-icon">🎯</span>
              <span className="tip-text">{i18n.tips.track}</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">📱</span>
              <span className="tip-text">{i18n.tips.scan}</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🤖</span>
              <span className="tip-text">{i18n.tips.ai}</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">📊</span>
              <span className="tip-text">{i18n.tips.review}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingInsights;