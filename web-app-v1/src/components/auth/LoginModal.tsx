'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuthState {
  loading: boolean;
  message: string;
  error: string;
  success: boolean;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, authenticated, user, ready, getAccessToken } = usePrivy();
  const [authState, setAuthState] = useState<AuthState>({
    loading: false,
    message: '',
    error: '',
    success: false
  });
  const [isPrivyModalOpen, setIsPrivyModalOpen] = useState(false);

  // Handle successful authentication - improved detection
  useEffect(() => {
    if (authenticated && user && ready && !authState.success) {
      console.log('Privy authentication detected:', { authenticated, user: !!user, ready });
      handleUserLogin();
    }
  }, [authenticated, user, ready, authState.success]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAuthState({ loading: false, message: '', error: '', success: false });
      setIsPrivyModalOpen(false);
    }
  }, [isOpen]);

  // Detect when Privy modal is dismissed without authentication
  useEffect(() => {
    if (isPrivyModalOpen && !authenticated && ready) {
      // Set a timeout to check if user cancelled Privy modal
      const timeout = setTimeout(() => {
        if (!authenticated && authState.loading && isPrivyModalOpen) {
          setAuthState(prev => ({ 
            ...prev, 
            loading: false,
            error: ''
          }));
          setIsPrivyModalOpen(false);
        }
      }, 3000); // 3 second timeout to allow for network delays

      return () => clearTimeout(timeout);
    }
  }, [isPrivyModalOpen, authenticated, ready, authState.loading]);

  const handleUserLogin = async () => {
    if (!user) return;
    
    setAuthState(prev => ({ ...prev, loading: true, error: '' }));
    
    try {
      // Get the access token from Privy - THIS IS THE REAL TOKEN
      const accessToken = await getAccessToken();
      
      const response = await fetch('/api/auth/privy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          accessToken: accessToken
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setAuthState({
          loading: false,
          message: result.message,
          error: '',
          success: true
        });
        setIsPrivyModalOpen(false);
        
        // Auto-close after showing success message
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        setAuthState({
          loading: false,
          message: '',
          error: result.error || 'Login failed. Please try again.',
          success: false
        });
        setIsPrivyModalOpen(false);
      }
    } catch (error) {
      setAuthState({
        loading: false,
        message: '',
        error: 'Connection error. Please try again.',
        success: false
      });
      setIsPrivyModalOpen(false);
    }
  };

  const handleLoginClick = async () => {
    try {
      // Reset state and show loading
      setAuthState({ loading: true, message: '', error: '', success: false });
      setIsPrivyModalOpen(true);
      await login();
    } catch (error) {
      console.error('Login error:', error);
      setAuthState({
        loading: false,
        message: '',
        error: 'Login failed. Please try again.',
        success: false
      });
      setIsPrivyModalOpen(false);
    }
  };

  const handleClose = () => {
    // Reset all state when closing
    setAuthState({ loading: false, message: '', error: '', success: false });
    setIsPrivyModalOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Access Premium Features
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {!authenticated ? (
          <div>
            <p className="text-gray-600 mb-6">
              Login to access AI insights, analytics, and premium content with instant USDC payments.
            </p>
            
            {authState.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {authState.error}
              </div>
            )}
            
            <button 
              onClick={handleLoginClick}
              disabled={authState.loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {authState.loading ? 'Connecting...' : 'Login with Privy'}
            </button>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              Supports email, wallet, Google, Twitter, and more
            </p>
          </div>
        ) : (
          <div className="text-center">
            {authState.loading ? (
              <div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Setting up your account...</p>
              </div>
            ) : authState.success ? (
              <div>
                <div className="text-green-500 text-4xl mb-2">✓</div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Welcome!</h3>
                <p className="text-gray-600 mb-4">{authState.message}</p>
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                  <div>Email: {user?.email?.address || 'Not provided'}</div>
                  <div>Wallet: {user?.wallet?.address ? `${user.wallet.address.slice(0,6)}...${user.wallet.address.slice(-4)}` : 'Not connected'}</div>
                </div>
                <p className="text-xs text-gray-500 mt-3">Closing automatically...</p>
              </div>
            ) : authState.error ? (
              <div>
                <div className="text-red-500 text-4xl mb-2">✗</div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Error</h3>
                <p className="text-red-600 mb-4">{authState.error}</p>
                <button 
                  onClick={() => setAuthState({ loading: false, message: '', error: '', success: false })}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Try Again
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
