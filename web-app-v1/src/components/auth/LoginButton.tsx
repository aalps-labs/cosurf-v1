'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import LoginModal from './LoginModal';

interface LoginButtonProps {
  className?: string;
  children?: React.ReactNode;
}

// Modular login button that can be dropped anywhere
export default function LoginButton({ className, children }: LoginButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { authenticated, user, logout, ready } = usePrivy();

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug authentication state changes
  useEffect(() => {
    if (mounted && ready) {
      console.log('LoginButton auth state:', { authenticated, user: !!user, ready });
    }
  }, [authenticated, user, ready, mounted]);

  // Show loading state until Privy is ready
  if (!mounted || !ready) {
    return (
      <div className={className || "bg-gray-300 text-gray-500 px-4 py-2 rounded-lg font-medium"}>
        Loading...
      </div>
    );
  }

  if (authenticated) {
    return (
      <div className={`flex items-center gap-3 ${className || ''}`}>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            {user?.email?.address || 'Wallet User'}
          </div>
          <div className="text-xs text-green-600">✓ Premium Access</div>
        </div>
        <button 
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className={className || "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"}
      >
        {children || "Login for Premium Features"}
      </button>
      
      <LoginModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
}
