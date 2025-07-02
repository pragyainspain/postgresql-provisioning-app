import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GitHubUser } from '../types';

interface AuthCallbackProps {
  onLogin: (user: GitHubUser, token: string) => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');

      if (token && userParam) {
        try {
          const user: GitHubUser = JSON.parse(decodeURIComponent(userParam));
          onLogin(user, token);
          navigate('/dashboard');
        } catch (error) {
          console.error('Error parsing user data:', error);
          navigate('/?error=auth_failed');
        }
      } else {
        console.error('Missing token or user data');
        navigate('/?error=auth_failed');
      }
    };

    handleCallback();
  }, [searchParams, onLogin, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 
