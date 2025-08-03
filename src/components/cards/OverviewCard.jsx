import React from 'react';

const OverviewCard = ({ 
  title, 
  amount, 
  icon, 
  type, 
  period = "This month",
  trend = null,
  onClick 
}) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getTrendIcon = (trendValue) => {
    if (!trendValue) return null;
    if (trendValue > 0) return '📈';
    if (trendValue < 0) return '📉';
    return '➖';
  };

  const getTrendClass = (trendValue) => {
    if (!trendValue) return '';
    if (trendValue > 0) return 'trend-up';
    if (trendValue < 0) return 'trend-down';
    return 'trend-neutral';
  };

  return (
    <div 
      className={`overview-card ${type}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="card-header">
        <div className="card-icon">{icon}</div>
        {trend !== null && (
          <div className={`card-trend ${getTrendClass(trend)}`}>
            <span className="trend-icon">{getTrendIcon(trend)}</span>
            <span className="trend-value">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-amount">{formatCurrency(amount)}</p>
        <span className="card-period">{period}</span>
      </div>
    </div>
  );
};

// Pre-configured card variants
export const IncomeCard = ({ amount, trend, onClick }) => (
  <OverviewCard
    title="Total Income"
    amount={amount}
    icon="💰"
    type="income"
    trend={trend}
    onClick={onClick}
  />
);

export const ExpenseCard = ({ amount, trend, onClick }) => (
  <OverviewCard
    title="Total Expense"
    amount={amount}
    icon="💸"
    type="expense"
    trend={trend}
    onClick={onClick}
  />
);

export const SavingsCard = ({ amount, trend, onClick }) => (
  <OverviewCard
    title="Total Savings"
    amount={amount}
    icon="🏦"
    type="savings"
    period="All goals"
    trend={trend}
    onClick={onClick}
  />
);

export const BalanceCard = ({ amount, trend, onClick }) => (
  <OverviewCard
    title="Net Balance"
    amount={amount}
    icon="📊"
    type="balance"
    trend={trend}
    onClick={onClick}
  />
);

export default OverviewCard;