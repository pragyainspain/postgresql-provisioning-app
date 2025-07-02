import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Database, Shield, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { authService } from '../services/api';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showTestCredentials, setShowTestCredentials] = useState(false);

  const handleGitHubLogin = async () => {
    try {
      setLoading(true);
      const { authUrl } = await authService.getGitHubAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    try {
      setLoading(true);
      // Simulate login with test credentials
      const testUser = {
        login: 'testuser',
        id: 12345,
        name: 'Test User',
        email: 'test@example.com'
      };
      const testToken = 'test-token-12345';
      
      // Call the onLogin prop to update auth state in App component
      onLogin(testUser, testToken);
      
      // Navigate to dashboard using React Router
      navigate('/dashboard');
    } catch (error) {
      console.error('Test login error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero */}
      <div className="flex-1 bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-12">
        <div className="max-w-lg text-white">
          <div className="flex items-center mb-8">
            <Database className="h-12 w-12 mr-4" />
            <h1 className="text-4xl font-bold">PostgreSQL Cloud</h1>
          </div>
          
          <h2 className="text-2xl font-semibold mb-6">
            Free Tier PostgreSQL Instances
          </h2>
          
          <p className="text-primary-100 text-lg mb-8">
            Get instant access to managed PostgreSQL databases. Perfect for development, testing, and small projects.
          </p>

          <div className="space-y-4">
            <div className="flex items-center">
              <Zap className="h-6 w-6 mr-3 text-yellow-300" />
              <span>Instant provisioning from pre-created instances</span>
            </div>
            <div className="flex items-center">
              <Shield className="h-6 w-6 mr-3 text-green-300" />
              <span>Secure GitHub authentication</span>
            </div>
            <div className="flex items-center">
              <Database className="h-6 w-6 mr-3 text-blue-300" />
              <span>Up to 3 free PostgreSQL instances per user</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login */}
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h3>
            <p className="text-gray-600">
              Sign in with your GitHub account to manage your PostgreSQL instances
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <button
              onClick={handleGitHubLogin}
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Github className="h-5 w-5 mr-3" />
                  Continue with GitHub
                </>
              )}
            </button>

            {/* Test Credentials Section */}
            <div className="mt-6">
              <button
                onClick={() => setShowTestCredentials(!showTestCredentials)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center py-2"
              >
                {showTestCredentials ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide Test Credentials
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show Test Credentials
                  </>
                )}
              </button>

              {showTestCredentials && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Test Account (Development Only)</h4>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        value="testuser"
                        readOnly
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value="testpass123"
                        readOnly
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleTestLogin}
                    disabled={loading}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-sm"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                    ) : (
                      'Login with Test Account'
                    )}
                  </button>

                  <p className="text-xs text-gray-500 mt-2 text-center">
                    This bypasses GitHub authentication for testing purposes
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 text-sm text-gray-500 text-center">
              <p>
                By signing in, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              New to PostgreSQL Cloud?{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500 font-medium">
                Learn more about our free tier
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
