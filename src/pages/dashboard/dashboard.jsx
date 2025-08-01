import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  WalletIcon,
  PlusIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  CreditCardIcon,
  PieChartIcon,
  BarChart3Icon,
  CalendarIcon,
  FilterIcon,
  DownloadIcon,
  BellIcon,
  SettingsIcon,
  LogOutIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ShoppingCartIcon,
  CarIcon,
  HomeIcon,
  UtensilsIcon,
  GamepadIcon,
  MoreHorizontalIcon
} from 'lucide-react';
import { authService } from '../../services/auth';
import './dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - In real app, this would come from API
  const [dashboardData, setDashboardData] = useState({
    balance: 15420.50,
    income: 8500.00,
    expenses: 3200.75,
    savings: 1850.25,
    monthlyChange: +12.5,
    transactions: [
      {
        id: 1,
        description: 'Salary Payment',
        amount: 5000.00,
        type: 'income',
        category: 'salary',
        date: '2024-01-15',
        icon: DollarSignIcon
      },
      {
        id: 2,
        description: 'Grocery Shopping',
        amount: -156.75,
        type: 'expense',
        category: 'food',
        date: '2024-01-14',
        icon: ShoppingCartIcon
      },
      {
        id: 3,
        description: 'Gas Station',
        amount: -65.00,
        type: 'expense',
        category: 'transport',
        date: '2024-01-14',
        icon: CarIcon
      },
      {
        id: 4,
        description: 'Rent Payment',
        amount: -1200.00,
        type: 'expense',
        category: 'housing',
        date: '2024-01-13',
        icon: HomeIcon
      },
      {
        id: 5,
        description: 'Restaurant',
        amount: -85.50,
        type: 'expense',
        category: 'food',
        date: '2024-01-12',
        icon: UtensilsIcon
      }
    ],
    categories: [
      { name: 'Food & Dining', amount: 850.25, percentage: 35, color: '#10B981' },
      { name: 'Transportation', amount: 425.00, percentage: 18, color: '#3B82F6' },
      { name: 'Shopping', amount: 320.75, percentage: 15, color: '#8B5CF6' },
      { name: 'Entertainment', amount: 280.50, percentage: 12, color: '#F59E0B' },
      { name: 'Bills & Utilities', amount: 245.00, percentage: 10, color: '#EF4444' },
      { name: 'Others', amount: 178.25, percentage: 10, color: '#6B7280' }
    ]
  });

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      navigate('/');
      return;
    }

    // Get user data
    const userData = authService.getCurrentUser();
    setUser(userData);
    setIsLoading(false);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.signout();
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      localStorage.clear();
      navigate('/');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-large"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-container">
            <WalletIcon className="logo-icon" />
            <h1 className="logo-text">PennyPal</h1>
          </div>
        </div>
        
        <div className="header-right">
          <button className="header-btn">
            <BellIcon className="btn-icon" />
          </button>
          <button className="header-btn">
            <SettingsIcon className="btn-icon" />
          </button>
          <div className="user-menu">
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-email">{user?.email}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <LogOutIcon className="btn-icon" />
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h2 className="welcome-title">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h2>
            <p className="welcome-subtitle">Here's your financial overview for {selectedPeriod.toLowerCase()}</p>
          </div>
          
          <div className="period-selector">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="period-select"
            >
              <option>This Week</option>
              <option>This Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {/* Balance Card */}
          <div className="stat-card balance-card">
            <div className="stat-header">
              <div className="stat-info">
                <h3 className="stat-title">Total Balance</h3>
                <div className="balance-controls">
                  <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="balance-toggle"
                  >
                    {showBalance ? <EyeOffIcon className="toggle-icon" /> : <EyeIcon className="toggle-icon" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="stat-value">
              {showBalance ? formatCurrency(dashboardData.balance) : '••••••'}
            </div>
            <div className="stat-change">
              <div className={`change-indicator ${dashboardData.monthlyChange >= 0 ? 'positive' : 'negative'}`}>
                {dashboardData.monthlyChange >= 0 ? 
                  <ArrowUpIcon className="change-icon" /> : 
                  <ArrowDownIcon className="change-icon" />
                }
                <span>{Math.abs(dashboardData.monthlyChange)}%</span>
              </div>
              <span className="change-text">vs last month</span>
            </div>
          </div>

          {/* Income Card */}
          <div className="stat-card income-card">
            <div className="stat-header">
              <div className="stat-icon income-icon">
                <TrendingUpIcon className="icon" />
              </div>
              <h3 className="stat-title">Income</h3>
            </div>
            <div className="stat-value">{formatCurrency(dashboardData.income)}</div>
            <div className="stat-subtitle">This month</div>
          </div>

          {/* Expenses Card */}
          <div className="stat-card expense-card">
            <div className="stat-header">
              <div className="stat-icon expense-icon">
                <TrendingDownIcon className="icon" />
              </div>
              <h3 className="stat-title">Expenses</h3>
            </div>
            <div className="stat-value">{formatCurrency(dashboardData.expenses)}</div>
            <div className="stat-subtitle">This month</div>
          </div>

          {/* Savings Card */}
          <div className="stat-card savings-card">
            <div className="stat-header">
              <div className="stat-icon savings-icon">
                <PieChartIcon className="icon" />
              </div>
              <h3 className="stat-title">Savings</h3>
            </div>
            <div className="stat-value">{formatCurrency(dashboardData.savings)}</div>
            <div className="stat-subtitle">This month</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="main-grid">
          {/* Recent Transactions */}
          <div className="content-card transactions-card">
            <div className="card-header">
              <h3 className="card-title">Recent Transactions</h3>
              <div className="card-actions">
                <button className="action-btn">
                  <FilterIcon className="btn-icon" />
                </button>
                <button className="action-btn">
                  <DownloadIcon className="btn-icon" />
                </button>
              </div>
            </div>
            
            <div className="transactions-list">
              {dashboardData.transactions.map((transaction) => {
                const IconComponent = transaction.icon;
                return (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-icon">
                      <IconComponent className="icon" />
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-description">{transaction.description}</div>
                      <div className="transaction-date">{formatDate(transaction.date)}</div>
                    </div>
                    <div className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'expense' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="card-footer">
              <button className="view-all-btn">View All Transactions</button>
            </div>
          </div>

          {/* Expense Categories */}
          <div className="content-card categories-card">
            <div className="card-header">
              <h3 className="card-title">Expense Categories</h3>
              <button className="action-btn">
                <BarChart3Icon className="btn-icon" />
              </button>
            </div>
            
            <div className="categories-list">
              {dashboardData.categories.map((category, index) => (
                <div key={index} className="category-item">
                  <div className="category-info">
                    <div 
                      className="category-indicator" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div className="category-details">
                      <div className="category-name">{category.name}</div>
                      <div className="category-amount">{formatCurrency(category.amount)}</div>
                    </div>
                  </div>
                  <div className="category-percentage">{category.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="quick-action-btn primary">
            <PlusIcon className="btn-icon" />
            Add Transaction
          </button>
          <button className="quick-action-btn">
            <CreditCardIcon className="btn-icon" />
            Add Account
          </button>
          <button className="quick-action-btn">
            <CalendarIcon className="btn-icon" />
            Set Budget
          </button>
          <button className="quick-action-btn">
            <BarChart3Icon className="btn-icon" />
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;