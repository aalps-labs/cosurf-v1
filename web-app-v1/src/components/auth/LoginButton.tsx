'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import LoginModal from './LoginModal';
import ChannelConnectionModal from './ChannelConnectionModal';
import { clearUserData } from '@/lib/auth/user-service';

interface LoginButtonProps {
  className?: string;
  children?: React.ReactNode;
}

// Modular login button that can be dropped anywhere
export default function LoginButton({ className, children }: LoginButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loginFlowComplete, setLoginFlowComplete] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { authenticated, user, logout, ready } = usePrivy();

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track login flow progress
  useEffect(() => {
    if (mounted && ready) {
      console.log('LoginButton auth state:', { 
        authenticated, 
        user: !!user, 
        ready, 
        isClearingData, 
        isLoggingIn,
        isLoggingOut,
        showModal,
        showChannelModal,
        loginFlowComplete,
        authMethod: user?.linkedAccounts?.[0]?.type || 'none'
      });
      
      // If we're logging in and authentication succeeds, keep loading until flow completes
      if (isLoggingIn && authenticated && user) {
        // Authentication successful, but keep loading until channel flow completes
        console.log('🔄 Authentication successful, waiting for channel flow...', {
          authMethod: user.linkedAccounts?.[0]?.type,
          email: user.email?.address,
          wallet: user.wallet?.address
        });
      }
    }
  }, [authenticated, user, ready, mounted, isClearingData, isLoggingIn, showModal, showChannelModal, loginFlowComplete]);

  // Detect when Privy authentication completes during login flow
  useEffect(() => {
    if (authenticated && user && ready && isLoggingIn && !showChannelModal) {
      console.log('✅ Privy authentication successful during login - showing channel modal');
      setShowModal(false); // Close login modal
      setShowChannelModal(true); // Open channel modal
    }
  }, [authenticated, user, ready, isLoggingIn, showChannelModal]);

  // Detect authentication on page load/redirect (Google OAuth, etc.)
  useEffect(() => {
    if (authenticated && user && ready && !loginFlowComplete && !isLoggingIn && !showChannelModal && !showModal && mounted && !isLoggingOut) {
      // Small delay to ensure Privy is fully initialized and not during logout
      const timer = setTimeout(() => {
        console.log('✅ User authenticated on page load/redirect - showing channel modal', {
          authMethod: user.linkedAccounts?.[0]?.type,
          email: user.email?.address,
          wallet: user.wallet?.address
        });
        setIsLoggingIn(true); // Set loading state
        setShowChannelModal(true); // Open channel modal directly
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [authenticated, user, ready, loginFlowComplete, isLoggingIn, showChannelModal, showModal, mounted, isLoggingOut]);

  // Reset loading state when login flow completes
  useEffect(() => {
    if (loginFlowComplete && isLoggingIn) {
      setIsLoggingIn(false);
      console.log('✅ Login flow completed!');
    }
  }, [loginFlowComplete, isLoggingIn]);

  // Show loading state until Privy is ready
  if (!mounted || !ready) {
    return (
      <div className={className || "bg-gray-300 text-gray-500 px-4 py-2 rounded-lg font-medium"}>
        Loading...
      </div>
    );
  }

  if (authenticated && loginFlowComplete) {
    return (
      <div className={`flex items-center gap-3 ${className || ''}`}>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            {user?.email?.address || user?.wallet?.address?.slice(0, 6) + '...' + user?.wallet?.address?.slice(-4) || 'User'}
          </div>
          <div className="text-xs text-green-600 flex items-center gap-1">
            <span className="animate-pulse">✨</span>
            <span>Premium Access</span>
          </div>
        </div>
        <button 
          onClick={async () => {
            console.log('🚪 Logging out - clearing all states and localStorage');
            setIsLoggingOut(true); // Prevent channel modal from opening during logout
            setLoginFlowComplete(false);
            setIsLoggingIn(false);
            setIsClearingData(false);
            setShowModal(false);
            setShowChannelModal(false);
            
            // Clear all stored user and channel data
            clearUserData();
            
            try {
              await logout();
            } catch (error) {
              console.warn('Logout error:', error);
            }
            
            // Reset logout state after logout completes
            setTimeout(() => {
              setIsLoggingOut(false);
            }, 500);
          }}
          className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
        >
          Logout
        </button>
      </div>
    );
  }

  // Clear any cached data for fresh login (async)
  const clearCachedData = async () => {
    return new Promise<void>((resolve) => {
      try {
        console.log('🧹 Starting data cleanup...');
        
        // Clear localStorage items that might contain user/channel data
        const keysToRemove = [
          'privy:token',
          'privy:refresh_token', 
          'user_channels',
          'channel_data',
          'user_profile'
        ];
        
        keysToRemove.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`🗑️ Cleared localStorage: ${key}`);
          }
        });
        
        // Clear sessionStorage as well
        const sessionKeys = ['temp_user_data', 'channel_search_results'];
        sessionKeys.forEach(key => {
          if (sessionStorage.getItem(key)) {
            sessionStorage.removeItem(key);
            console.log(`🗑️ Cleared sessionStorage: ${key}`);
          }
        });
        
        // Add a small delay to ensure cleanup is complete
        setTimeout(() => {
          console.log('✅ Data cleanup completed');
          resolve();
        }, 100);
        
      } catch (error) {
        console.warn('Failed to clear some cached data:', error);
        resolve(); // Still resolve to continue the flow
      }
    });
  };

  // Handle login button click - clear data then start login
  const handleLoginClick = async () => {
    console.log('🚀 Starting fresh login process...');
    
    // Reset component states first
    setLoginFlowComplete(false);
    setShowChannelModal(false);
    
    // Show clearing state
    setIsClearingData(true);
    
    // Clear any cached data first (await completion)
    await clearCachedData();
    
    // Now show loading state and start login
    console.log('🔄 Data cleared, starting login flow...');
    setIsClearingData(false);
    setIsLoggingIn(true);
    setShowModal(true);
  };

  // Handle channel modal completion
  const handleChannelModalComplete = () => {
    console.log('✅ Channel connection completed');
    setShowChannelModal(false);
    setLoginFlowComplete(true);
  };

  // Handle channel modal close (user clicked X button - complete logout)
  const handleChannelModalClose = async () => {
    console.log('❌ Channel modal closed by user - complete logout performed');
    
    // Reset all login button states to initial state
    setShowChannelModal(false);
    setShowModal(false);
    setIsLoggingIn(false);
    setIsClearingData(false);
    setLoginFlowComplete(false);
    
    // Note: ChannelConnectionModal handles Privy logout and data clearing
    // User is now completely logged out and back to initial state
  };

  return (
    <>
      <button 
        onClick={handleLoginClick}
        disabled={isClearingData || isLoggingIn}
        className={`${className || "bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"} ${(isClearingData || isLoggingIn) ? 'opacity-75' : ''}`}
      >
        {isClearingData ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Clearing data...</span>
          </div>
        ) : isLoggingIn ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Logging in...</span>
          </div>
        ) : (
          children || "Login for Premium Features"
        )}
      </button>
      
      <LoginModal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          setIsLoggingIn(false);
        }} 
      />
      
      {/* Channel Connection Modal - now at LoginButton level */}
      <ChannelConnectionModal
        isOpen={showChannelModal}
        onClose={handleChannelModalClose}
        onComplete={handleChannelModalComplete}
      />
    </>
  );
}
