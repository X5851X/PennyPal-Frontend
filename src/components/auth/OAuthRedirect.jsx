import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.js';

const OAuthRedirect = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get token from URL parameters
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        console.log('🔍 OAuth Redirect - Token:', token);
        console.log('🔍 OAuth Redirect - Error:', error);

        if (error) {
          console.error('❌ OAuth Error:', error);
          alert('Google authentication failed. Please try again.');
          navigate('/');
          return;
        }

        if (!token) {
          console.error('❌ No token received');
          alert('Authentication failed - no token received.');
          navigate('/');
          return;
        }

        // Store the token
        localStorage.setItem('pennypal_token', token);
        
        // Get user data using the token
        try {
          // Make a request to get user data
          const response = await fetch(`${import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND || 'https://pennypal-backend.ddns.net')}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const userData = await response.json();
            if (userData.success && userData.user) {
              localStorage.setItem('pennypal_user', JSON.stringify(userData.user));
              console.log('✅ User data stored:', userData.user);
            }
          }
        } catch (userError) {
          console.error('❌ Error fetching user data:', userError);
          // Continue anyway, we have the token
        }

        console.log('✅ OAuth successful, redirecting to dashboard');
        navigate('/dashboard');

      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        alert('Authentication failed. Please try again.');
        navigate('/');
      }
    };

    handleOAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing Google authentication...</p>
      </div>
    </div>
  );
};

export default OAuthRedirect;