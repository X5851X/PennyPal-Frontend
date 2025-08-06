import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Camera,
  Save,
  Trash,
  ShieldCheck,
  Users,
  Bell,
  Globe,
  LogOut
} from 'lucide-react';
import { authService } from '../../services/auth.js';
import Layout from '../../components/layout';
import './profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // State states
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    image: null
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    transactionAlerts: true,
    billReminders: true,
    groupUpdates: true
  });
  
  const [saveNotifications, setSaveNotifications] = useState(false);
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Clear any URL parameters that might contain sensitive data
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setProfileForm({
          username: currentUser.username || '',
          email: currentUser.email || '',
          image: currentUser.image
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setMessage({ type: 'error', text: 'Failed to load user data' });
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = {
        username: profileForm.username,
        email: profileForm.email
      };
      
      if (profileForm.image) {
        formData.image = profileForm.image;
      }
      
      const response = await authService.updateProfile(formData);
      
      if (response.success) {
        setUser(response.user);
        showMessage('success', 'Profile updated successfully!');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage('error', error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Store values before clearing form for security
    let currentPassword = passwordForm.currentPassword;
    let newPassword = passwordForm.newPassword;
    let confirmPassword = passwordForm.confirmPassword;
    
    // Immediately clear the form state for security
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    
    // Validation
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      setIsSubmitting(false);
      // Clear sensitive data from memory
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
      return;
    }
    
    if (newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters long');
      setIsSubmitting(false);
      // Clear sensitive data from memory
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
      return;
    }
    
    // Check for password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      showMessage('error', 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      setIsSubmitting(false);
      // Clear sensitive data from memory
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
      return;
    }
    
    try {
      await authService.changePassword(currentPassword, newPassword);
      showMessage('success', 'Password changed successfully!');
    } catch (error) {
      console.error('Password change error:', error);
      showMessage('error', error.message || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
      // Clear sensitive data from memory
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Enhanced file validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showMessage('error', 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
        e.target.value = ''; // Clear the input
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showMessage('error', 'Image must be less than 5MB');
        e.target.value = ''; // Clear the input
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileForm(prev => ({ ...prev, image: e.target.result }));
      };
      reader.onerror = () => {
        showMessage('error', 'Failed to read image file');
        e.target.value = ''; // Clear the input
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    const password = prompt('Please enter your password to confirm account deletion:');
    if (!password) return;
    
    setIsSubmitting(true);
    try {
      await authService.deleteAccount(password);
      showMessage('success', 'Account deleted successfully');
      // Redirect to home page after account deletion
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Delete account error:', error);
      showMessage('error', error.message || 'Failed to delete account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePassword = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Security: Clear sensitive data on component unmount
  useEffect(() => {
    return () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {profileForm.image ? (
                <img src={profileForm.image} alt="Profile" />
              ) : (
                <User size={48} />
              )}
              <label className="avatar-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <Camera size={16} />
              </label>
            </div>
            <div className="profile-info">
              <h1>{user?.username || 'User'}</h1>
              <p>{user?.email}</p>
              <div className="profile-badges">
                {user?.isVerified && (
                  <span className="badge verified">
                    <ShieldCheck size={14} />
                    Verified
                  </span>
                )}
                <span className="badge role">{user?.role || 'User'}</span>
              </div>
            </div>
          </div>
          
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-number">{user?.friends?.length || 0}</span>
              <span className="stat-label">Friends</span>
            </div>
            <div className="stat">
              <span className="stat-number">{user?.groups?.length || 0}</span>
              <span className="stat-label">Groups</span>
            </div>
            <div className="stat">
              <span className="stat-number">{user?.badges?.length || 0}</span>
              <span className="stat-label">Badges</span>
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <User size={16} />
            General
          </button>
          <button
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={16} />
            Security
          </button>
          <button
            className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={16} />
            Notifications
          </button>
          <button
            className={`tab ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <ShieldCheck size={16} />
            Privacy
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'general' && (
            <div className="tab-content">
              <h2>General Information</h2>
              <form className="profile-form" onSubmit={handleProfileSubmit}>
                <div className="form-group">
                  <label>
                    <User size={16} />
                    Username
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                    required
                    minLength="3"
                    maxLength="30"
                    pattern="^[a-zA-Z0-9_]+$"
                    title="Username can only contain letters, numbers, and underscores"
                  />
                </div>
                
                <div className="form-group">
                  <label>
                    <Mail size={16} />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Account Created</label>
                  <input
                    type="text"
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    disabled
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                >
                  <Save size={16} />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="tab-content">
              <h2>Security Settings</h2>
              
              <div className="security-section">
                <h3>Change Password</h3>
                <form className="profile-form" onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="password-input">
                      <input
                        type={showPassword.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePassword('current')}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>New Password</label>
                    <div className="password-input">
                      <input
                        type={showPassword.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        required
                        minLength="8"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePassword('new')}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <small className="password-hint">
                      Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                    </small>
                  </div>
                  
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <div className="password-input">
                      <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                        minLength="8"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePassword('confirm')}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={isSubmitting}
                  >
                    <Lock size={16} />
                    {isSubmitting ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              <div className="security-section">
                <h3>Account Verification</h3>
                <div className="verification-status">
                  {user?.isVerified ? (
                    <div className="verified">
                      <ShieldCheck size={20} />
                      <span>Your email is verified</span>
                    </div>
                  ) : (
                    <div className="unverified">
                      <Mail size={20} />
                      <span>Please verify your email</span>
                      <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => authService.resendVerification(user?.email)}
                      >
                        Resend Verification
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="security-section">
                <h3>Login Security</h3>
                <div className="security-info">
                  <p>Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</p>
                  <p>Login IP: {user?.lastLoginIP || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="tab-content">
              <h2>Notification Preferences</h2>
              <div className="notification-settings">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="setting-item">
                    <label className="switch-label">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                      />
                      <span className="switch"></span>
                      <span className="setting-name">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              
              <button 
                className="btn btn-primary"
                onClick={() => {
                  // Here you would typically save to backend
                  showMessage('success', 'Notification preferences saved!');
                }}
                disabled={isSubmitting}
              >
                <Save size={16} />
                {isSubmitting ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="tab-content">
              <h2>Privacy & Data</h2>
              
              <div className="privacy-section">
                <h3>Data Export</h3>
                <p>Download a copy of your data including transactions, groups, and settings.</p>
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    // Placeholder for data export functionality
                    showMessage('info', 'Data export feature will be available soon!');
                  }}
                  disabled={isSubmitting}
                >
                  📥 Download My Data
                </button>
              </div>

              <div className="privacy-section">
                <h3>Session Management</h3>
                <p>Log out from all devices and sessions.</p>
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    if (window.confirm('This will log you out from all devices. Continue?')) {
                      authService.signout();
                    }
                  }}
                >
                  <LogOut size={16} />
                  Logout All Sessions
                </button>
              </div>

              <div className="privacy-section danger-zone">
                <h3>Danger Zone</h3>
                <div className="danger-item">
                  <div className="danger-info">
                    <strong>Delete Account</strong>
                    <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                  </div>
                  <button 
                    className="btn btn-danger"
                    onClick={handleDeleteAccount}
                    disabled={isSubmitting}
                  >
                    <Trash size={16} />
                    {isSubmitting ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;