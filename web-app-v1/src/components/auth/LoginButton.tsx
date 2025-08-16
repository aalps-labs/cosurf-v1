'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import { useUserData } from './DataProvider';
import LoginModal from './LoginModal';
import ChannelConnectionModal from './ChannelConnectionModal';
import { 
  LogIn, 
  Sparkles, 
  Zap, 
  Shield,
  ArrowRight,
  Crown
} from 'lucide-react';

export default function LoginButton() {
  const { authenticated, user, ready } = usePrivy();
  const { userChannels, hasChannelData } = useUserData();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user has already completed setup
  const hasCompletedSetup = () => {
    try {
      const connectedChannels = localStorage.getItem('connected_channels');
      const connectionTimestamp = localStorage.getItem('channel_connection_timestamp');
      
      // Check if we have valid channel data and it's not too old (24 hours)
      if (connectedChannels && connectionTimestamp) {
        const timestamp = new Date(connectionTimestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          console.log('✅ User has completed setup recently, skipping channel modal');
          return true;
        } else {
          console.log('⏰ Channel data is old, will refresh');
          // Clear old data
          localStorage.removeItem('connected_channels');
          localStorage.removeItem('channel_connection_timestamp');
        }
      }
      
      return false;
    } catch (error) {
      console.warn('Error checking setup completion:', error);
      return false;
    }
  };

  // Detect authentication on page load/redirect (Google OAuth, etc.)
  useEffect(() => {
    if (authenticated && user && ready && mounted && !showChannelModal && !showLoginModal) {
      // Check if user already has channel data (complete setup)
      if (hasChannelData) {
        console.log('🎯 User already has channels, setup complete');
        return;
      }
      
      // Check localStorage for recent setup completion
      if (hasCompletedSetup()) {
        console.log('🎯 User already completed setup recently, no need for channel modal');
        return;
      }
      
      // Small delay to ensure Privy is fully initialized
      const timer = setTimeout(() => {
        console.log('✅ User authenticated but missing channels - showing channel modal', {
          authMethod: user.linkedAccounts?.[0]?.type,
          email: user.email?.address,
          wallet: user.wallet?.address,
          channelCount: userChannels.length
        });
        setShowChannelModal(true); // Open channel modal directly
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [authenticated, user, ready, mounted, showChannelModal, showLoginModal, hasChannelData]);

  // Handle successful login - show channel connection modal
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    setShowChannelModal(true);
  };

  // Handle channel connection completion
  const handleChannelConnectionComplete = () => {
    console.log('✅ Channel connection completed - refreshing site');
    // Small delay to let any final API calls complete, then refresh
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Handle channel modal close (X button)
  const handleChannelModalClose = () => {
    console.log('❌ Channel modal closed - refreshing site');
    // Small delay for smooth UX, then refresh
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  if (!ready || !mounted) {
    return (
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-24 h-10 bg-gray-100 rounded-xl"
      />
    );
  }

  // Only hide login button if user has BOTH Privy auth AND channel data
  if (authenticated && user && hasChannelData) {
    return null; // Don't show login button if fully authenticated
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={() => setShowLoginModal(true)}
        className="relative group overflow-hidden"
      >
        {/* Animated Background */}
        <motion.div
          animate={{
            background: isHovered 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
              : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)'
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-xl"
        />
        
        {/* Shimmer Effect */}
        <motion.div
          animate={{ x: isHovered ? ['-100%', '100%'] : '-100%' }}
          transition={{ 
            duration: isHovered ? 1.5 : 0,
            ease: "easeInOut",
            repeat: isHovered ? Infinity : 0,
            repeatDelay: 1
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        />

        {/* Button Content */}
        <div className="relative px-6 py-2.5 flex items-center space-x-2 text-white">
          <motion.div
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.6 }}
          >
            <LogIn className="w-4 h-4" />
          </motion.div>
          
          <span className="font-semibold text-sm">Sign In</span>
          
          <motion.div
            animate={{ x: isHovered ? 3 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        </div>

        {/* Glow Effect */}
        <motion.div
          animate={{
            boxShadow: isHovered 
              ? '0 0 30px rgba(139, 92, 246, 0.6), 0 0 60px rgba(236, 72, 153, 0.3)'
              : '0 4px 15px rgba(79, 70, 229, 0.3)'
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-xl -z-10"
        />
      </motion.button>

      {/* Premium Features Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50"
          >
            <div className="text-center mb-3">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-gray-900">Unlock Premium Features</h3>
              </div>
              <p className="text-sm text-gray-600">Join thousands of creators and unlock your potential</p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                <span className="text-gray-700">AI-powered insights & analytics</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                <span className="text-gray-700">Instant USDC payments</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-full"></div>
                <span className="text-gray-700">Premium content access</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-full"></div>
                <span className="text-gray-700">Advanced channel management</span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <Shield className="w-3 h-3" />
              <span>Secure • Fast • Decentralized</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Channel Connection Modal */}
      <ChannelConnectionModal
        isOpen={showChannelModal}
        onClose={handleChannelModalClose}
        onComplete={handleChannelConnectionComplete}
      />
    </>
  );
}