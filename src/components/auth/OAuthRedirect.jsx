import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OAuthRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const error = urlParams.get('error');

        if (error) {
          alert('Google authentication failed. Please try again.');
          navigate('/');
          return;
        }

        if (!token) {
          alert('Authentication failed - no token received.');
          navigate('/');
          return;
        }

        // Store token
        localStorage.setItem('pennypal_token', token);
        
        // Get user data
        try {
          const response = await fetch('https://pennypal-backend.ddns.net/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const userData = await response.json();
            if (userData.success && userData.user) {
              localStorage.setItem('pennypal_user', JSON.stringify(userData.user));
            }
          }
        } catch (userError) {
          console.error('Error fetching user data:', userError);
        }

        navigate('/dashboard');

      } catch (error) {
        console.error('OAuth callback error:', error);
        alert('Authentication failed. Please try again.');
        navigate('/');
      }
    };

    handleOAuthCallback();
  }, [navigate]);

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