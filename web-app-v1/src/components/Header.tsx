'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import { useUserData } from './auth/DataProvider';
import LoginButton from './auth/LoginButton';
import { getCurrentAvatarUrl } from '@/lib/avatar-utils';
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  Crown, 
  Zap, 
  Star,
  ChevronDown,
  Menu,
  X,
  Home,
  Compass,
  TrendingUp,
  Wallet
} from 'lucide-react';
import Link from 'next/link';

interface UserBadge {
  type: 'premium' | 'pro' | 'elite' | 'legendary';
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

export default function Header() {
  const { authenticated, user, logout } = usePrivy();
  const { userChannels, hasChannelData } = useUserData();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Determine user badge based on channels and activity
  const getUserBadge = (): UserBadge | null => {
    if (!authenticated || userChannels.length === 0) return null;
    
    const totalReputation = userChannels.reduce((sum, channel) => sum + (channel.rep_score || 0), 0);
    const totalFollowers = userChannels.reduce((sum, channel) => sum + (channel.followers_count || 0), 0);
    
    if (totalReputation >= 500 || totalFollowers >= 10000) {
      return {
        type: 'legendary',
        label: 'Legendary',
        color: 'text-yellow-600',
        bgColor: 'bg-gradient-to-r from-yellow-400 to-orange-500',
        icon: <Crown className="w-3 h-3" />
      };
    } else if (totalReputation >= 300 || totalFollowers >= 5000) {
      return {
        type: 'elite',
        label: 'Elite',
        color: 'text-purple-600',
        bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
        icon: <Zap className="w-3 h-3" />
      };
    } else if (totalReputation >= 150 || totalFollowers >= 1000) {
      return {
        type: 'pro',
        label: 'Pro',
        color: 'text-blue-600',
        bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        icon: <Star className="w-3 h-3" />
      };
    } else if (userChannels.length >= 1) {
      return {
        type: 'premium',
        label: 'Member',
        color: 'text-emerald-600',
        bgColor: 'bg-gradient-to-r from-emerald-400 to-teal-500',
        icon: <User className="w-3 h-3" />
      };
    }
    
    return null;
  };

  const userBadge = getUserBadge();

  // State for avatar error handling
  const [failedAvatars, setFailedAvatars] = useState<Map<string, number>>(new Map());

  // Handle avatar load error
  const handleAvatarError = (channelId: string) => {
    setFailedAvatars(prev => {
      const newMap = new Map(prev);
      const currentFailures = newMap.get(channelId) || 0;
      newMap.set(channelId, currentFailures + 1);
      return newMap;
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
      // Clear any cached data
      localStorage.removeItem('connected_channels');
      localStorage.removeItem('channel_connection_timestamp');
      
      console.log('✅ Logout completed - refreshing site');
      // Small delay to let any final cleanup complete, then refresh
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo & Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-white font-bold text-sm"
                >
                  S
                </motion.div>
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                  Cosurf
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  Surf the Internet differently, Secured with Crypto
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200">
                <Home className="w-4 h-4 inline mr-2" />
                Home
              </Link>
              <Link href="/discover" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200">
                <Compass className="w-4 h-4 inline mr-2" />
                Discover
              </Link>
              <Link href="/trending" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Trending
              </Link>
            </nav>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <motion.div
              animate={{ 
                scale: isSearchFocused ? 1.02 : 1,
                boxShadow: isSearchFocused 
                  ? '0 10px 25px -5px rgba(99, 102, 241, 0.1), 0 0 0 1px rgba(99, 102, 241, 0.2)' 
                  : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
              transition={{ duration: 0.2 }}
              className="relative w-full"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`h-4 w-4 transition-colors duration-200 ${
                  isSearchFocused ? 'text-indigo-500' : 'text-gray-400'
                }`} />
              </div>
              <input
                type="text"
                placeholder="Search channels, users, content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 backdrop-blur-sm text-sm placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-indigo-300 focus:bg-white transition-all duration-200"
              />
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center space-x-4">
            
            {/* Notifications (authenticated users only) */}
            {authenticated && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
              >
                <Bell className="w-5 h-5" />
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                />
              </motion.button>
            )}

            {/* Wallet (authenticated users only) */}
            {authenticated && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
              >
                <Wallet className="w-5 h-5" />
              </motion.button>
            )}

            {/* Authentication Section */}
            {authenticated && user && hasChannelData ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-xl transition-all duration-200"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={getCurrentAvatarUrl(
                        userChannels[0]?.id || user.id, 
                        userChannels[0]?.name || user.email?.address?.split('@')[0] || 'User',
                        failedAvatars.get(userChannels[0]?.id || user.id) || 0
                      )}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-gray-200"
                      onError={() => handleAvatarError(userChannels[0]?.id || user.id)}
                    />
                    {userBadge && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-1 -right-1"
                      >
                        <div className={`w-4 h-4 ${userBadge.bgColor} rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white`}>
                          {userBadge.icon}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="hidden sm:block text-left">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                        {user.email?.address?.split('@')[0] || 'User'}
                      </p>
                      {userBadge && (
                        <motion.span
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${userBadge.bgColor} text-white shadow-sm`}
                        >
                          {userBadge.icon}
                          <span className="ml-1">{userBadge.label}</span>
                        </motion.span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {userChannels.length} channel{userChannels.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    isProfileOpen ? 'rotate-180' : ''
                  }`} />
                </motion.button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                    >
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-50">
                        <div className="flex items-center space-x-3">
                          <img
                            src={getCurrentAvatarUrl(
                              userChannels[0]?.id || user.id, 
                              userChannels[0]?.name || user.email?.address?.split('@')[0] || 'User',
                              failedAvatars.get(userChannels[0]?.id || user.id) || 0
                            )}
                            alt="Profile"
                            className="w-10 h-10 rounded-full"
                            onError={() => handleAvatarError(userChannels[0]?.id || user.id)}
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.email?.address?.split('@')[0] || 'User'}
                            </p>
                            <p className="text-sm text-gray-500">{user.email?.address}</p>
                          </div>
                        </div>
                        {userBadge && (
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${userBadge.bgColor} text-white`}>
                              {userBadge.icon}
                              <span className="ml-1">{userBadge.label} Member</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          href={userChannels.length > 0 ? `/channels/${userChannels[0].id}` : "/profile"}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="w-4 h-4 mr-3" />
                          {userChannels.length > 0 ? 'My Channel' : 'Profile'}
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Settings
                        </Link>
                        <div className="border-t border-gray-50 my-1"></div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <LoginButton />
            )}

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-gray-100 py-4 space-y-2"
            >
              {/* Mobile Search */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Mobile Navigation */}
              <Link
                href="/"
                className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5 mr-3" />
                Home
              </Link>
              <Link
                href="/discover"
                className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Compass className="w-5 h-5 mr-3" />
                Discover
              </Link>
              <Link
                href="/trending"
                className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TrendingUp className="w-5 h-5 mr-3" />
                Trending
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}