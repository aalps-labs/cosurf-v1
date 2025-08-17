'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

interface AuthState {
  loading: boolean;
  message: string;
  error: string;
  success: boolean;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const { login, authenticated, user, ready, getAccessToken } = usePrivy();
  const [authState, setAuthState] = useState<AuthState>({
    loading: false,
    message: '',
    error: '',
    success: false
  });
  const [isPrivyModalOpen, setIsPrivyModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle successful authentication - trigger channel connection flow
  useEffect(() => {
    if (authenticated && user && ready && isOpen) {
      console.log('✅ Privy authentication successful in LoginModal');
      setAuthState({
        loading: false,
        message: 'Authentication successful! Setting up your account...',
        error: '',
        success: true
      });
      setIsPrivyModalOpen(false);
      
      // Trigger the channel connection modal after a brief delay
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 1000);
    }
  }, [authenticated, user, ready, isOpen, onLoginSuccess]);

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

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-100 relative overflow-hidden"
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"></div>
        </div>

        {/* Header */}
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
              >
                Welcome to Surf
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 mt-1"
              >
                Unlock premium features & AI insights
              </motion.p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          {/* Content */}
          {!authenticated ? (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">AI Insights</h4>
                  <p className="text-xs text-gray-600">Smart analytics & recommendations</p>
                </div>

                <div className="p-3 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-100">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">USDC Payments</h4>
                  <p className="text-xs text-gray-600">Instant crypto transactions</p>
                </div>

                <div className="p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">Premium Content</h4>
                  <p className="text-xs text-gray-600">Exclusive creator access</p>
                </div>

                <div className="p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">Secure Wallet</h4>
                  <p className="text-xs text-gray-600">Protected by Privy</p>
                </div>
              </div>
              
              {authState.error && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center space-x-2"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{authState.error}</span>
                </motion.div>
              )}
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLoginClick}
                disabled={authState.loading}
                className="w-full relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                <div className="flex items-center justify-center space-x-2">
                  {authState.loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span>Continue with Privy</span>
                    </>
                  )}
                </div>
              </motion.button>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 mb-2">
                  Supports multiple login methods
                </p>
                <div className="flex items-center justify-center space-x-4 text-gray-400">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-xs">Google</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span className="text-xs">Twitter</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span className="text-xs">Wallet</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              {authState.loading ? (
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Setting up your account...</p>
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
              ) : authState.success ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-8"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="text-green-500 text-5xl mb-4"
                  >
                    ✓
                  </motion.div>
                  <h3 className="font-semibold text-xl mb-2 text-gray-900">Welcome to Surf!</h3>
                  <p className="text-gray-600 mb-4">Authentication successful</p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"
                    />
                    <span>Setting up your channels...</span>
                  </div>
                </motion.div>
              ) : (
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Preparing your account...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}