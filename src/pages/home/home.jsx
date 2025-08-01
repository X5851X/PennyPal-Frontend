import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  WalletIcon, 
  EyeIcon, 
  EyeOffIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  BarChart3Icon
} from 'lucide-react';
import { authService } from "../../services/auth.js";
import './home.css'; 

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sign In Form State
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('pennypal_token') || localStorage.getItem('jwt_token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Handle Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await authService.signin(signInData.email, signInData.password);
      
      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (error) {
      console.error('Sign in error:', error);
      alert(error.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (signUpData.password !== signUpData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const data = await authService.signup(
        signUpData.name, 
        signUpData.email, 
        signUpData.password
      );
      
      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (error) {
      console.error('Sign up error:', error);
      alert(error.message || 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleAuth = () => {
    authService.googleAuth();
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-container">
            <div className="logo-icon">
              <WalletIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="logo-text">PennyPal</h1>
          </div>
        </div>
      </header>

      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="main-grid">
            
            {/* Left Side - Hero Content */}
            <div className="hero-section">
              <div className="hero-content">
                <h2 className="hero-title">
                  Master Your
                  <span className="hero-title-gradient">
                    {' '}Money
                  </span>
                </h2>
                <p className="hero-description">
                  Take control of your finances with intelligent expense tracking, 
                  budgeting tools, and financial insights that help you save more.
                </p>
              </div>

              {/* Features */}
              <div className="features-list">
                <div className="feature-item">
                  <div className="feature-icon green">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="feature-text">Track expenses automatically</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon emerald">
                    <TrendingUpIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="feature-text">Smart budget management</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon teal">
                    <BarChart3Icon className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="feature-text">Detailed financial analytics</span>
                </div>
              </div>
            </div>

            {/* Right Side - Auth Forms */}
            <div className="auth-card">
              <div className="auth-form-container">
                
                {/* Tab Switcher */}
                <div className="tab-switcher">
                  <button
                    onClick={() => setActiveTab('signin')}
                    className={`tab-button ${activeTab === 'signin' ? 'active' : 'inactive'}`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setActiveTab('signup')}
                    className={`tab-button ${activeTab === 'signup' ? 'active' : 'inactive'}`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Sign In Form */}
                {activeTab === 'signin' && (
                  <form onSubmit={handleSignIn} className="form-group">
                    <div className="form-header">
                      <h3 className="form-title">Welcome Back</h3>
                      <p className="form-subtitle">Sign in to your account</p>
                    </div>

                    <div className="form-group">
                      <div className="form-field">
                        <label className="form-label">
                          Email Address
                        </label>
                        <div className="input-wrapper">
                          <MailIcon className="input-icon" />
                          <input
                            type="email"
                            value={signInData.email}
                            onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                            className="form-input with-left-icon"
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-field">
                        <label className="form-label">
                          Password
                        </label>
                        <div className="input-wrapper">
                          <LockIcon className="input-icon" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={signInData.password}
                            onChange={(e) => setSignInData({...signInData, password: e.target.value})}
                            className="form-input with-both-icons"
                            placeholder="Enter your password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="password-toggle"
                          >
                            {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {isLoading ? (
                        <div className="loading-spinner" />
                      ) : (
                        <>
                          Sign In
                          <ArrowRightIcon className="w-5 h-5" />
                        </>
                      )}
                    </button>

                    <div className="divider-container">
                      <div className="divider-line">
                        <div />
                      </div>
                      <div className="divider-text">
                        <span>Or continue with</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      className="btn-google"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                  </form>
                )}

                {/* Sign Up Form */}
                {activeTab === 'signup' && (
                  <form onSubmit={handleSignUp} className="form-group">
                    <div className="form-header">
                      <h3 className="form-title">Create Account</h3>
                      <p className="form-subtitle">Start your financial journey</p>
                    </div>

                    <div className="form-group">
                      <div className="form-field">
                        <label className="form-label">
                          Full Name
                        </label>
                        <div className="input-wrapper">
                          <UserIcon className="input-icon" />
                          <input
                            type="text"
                            value={signUpData.name}
                            onChange={(e) => setSignUpData({...signUpData, name: e.target.value})}
                            className="form-input with-left-icon"
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-field">
                        <label className="form-label">
                          Email Address
                        </label>
                        <div className="input-wrapper">
                          <MailIcon className="input-icon" />
                          <input
                            type="email"
                            value={signUpData.email}
                            onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                            className="form-input with-left-icon"
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-field">
                        <label className="form-label">
                          Password
                        </label>
                        <div className="input-wrapper">
                          <LockIcon className="input-icon" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={signUpData.password}
                            onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                            className="form-input with-both-icons"
                            placeholder="Create a password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="password-toggle"
                          >
                            {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="form-field">
                        <label className="form-label">
                          Confirm Password
                        </label>
                        <div className="input-wrapper">
                          <LockIcon className="input-icon" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={signUpData.confirmPassword}
                            onChange={(e) => setSignUpData({...signUpData, confirmPassword: e.target.value})}
                            className="form-input with-both-icons"
                            placeholder="Confirm your password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="password-toggle"
                          >
                            {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {isLoading ? (
                        <div className="loading-spinner" />
                      ) : (
                        <>
                          Create Account
                          <ArrowRightIcon className="w-5 h-5" />
                        </>
                      )}
                    </button>

                    <div className="divider-container">
                      <div className="divider-line">
                        <div />
                      </div>
                      <div className="divider-text">
                        <span>Or continue with</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      className="btn-google"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign up with Google
                    </button>

                    <p className="terms-text">
                      By creating an account, you agree to our{' '}
                      <a href="#" className="terms-link">Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" className="terms-link">Privacy Policy</a>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;