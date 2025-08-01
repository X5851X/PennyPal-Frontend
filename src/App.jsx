import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home/home';
import Dashboard from './pages/dashboard/dashboard';
import OAuthRedirect from './components/auth/OAuthRedirect';
import { authService } from './services/auth';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Public Route Component (redirect to dashboard jika sudah login)
const PublicRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public Routes - redirect ke dashboard jika sudah login */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <Home />
            </PublicRoute>
          } 
        />
        
        {/* OAuth Redirect Route - ADD THIS ROUTE */}
        <Route path="/oauth-redirect" element={<OAuthRedirect />} />
        
        {/* Protected Routes - perlu login */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Tambahkan protected routes lainnya di sini */}
        {/* 
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        */}
        
        {/* Catch all route - redirect ke home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;