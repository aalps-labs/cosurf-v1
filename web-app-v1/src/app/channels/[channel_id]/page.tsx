'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';
import AuthProvider from '../../../components/auth/AuthProvider';
import DataProvider from '../../../components/auth/DataProvider';
import LoginTriggerProvider from '../../../components/auth/LoginTriggerContext';
import Header from '../../../components/Header';
import { useUserData } from '../../../components/auth/DataProvider';
import { Users, Star, Circle, RefreshCw, FolderTree as FolderTreeIcon, ExternalLink, Coins, ChevronDown, Heart } from 'lucide-react';
import FolderTree from '../../../components/FolderTree';
import ChatInterface from '../../../components/ChatInterface';
import ChannelInterface from '../../../components/ChannelInterface';
import RecentUpdates from '../../../components/RecentUpdates';
import { useChannelData } from '../../../hooks/useChannelData';
import type { Document } from '../../../components/FolderTree';

interface ChannelInfo {
  id: string;
  name: string;
  channel_handle: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  followers_count: number;
  rep_score: number;
  user_id: string;
}

function ChannelContent() {
  const params = useParams();
  const channelId = params.channel_id as string;
  const { userChannels } = useUserData();
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'channel' | 'chat'>('channel');
  const [showRecentUpdates, setShowRecentUpdates] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingInProgress, setFollowingInProgress] = useState(false);
  
  // Load channel data (folders and documents)
  const { 
    folders, 
    documents, 
    isLoading: dataLoading, 
    error: dataError, 
    lastSyncTime,
    refetch: refetchData,
    sync: syncData 
  } = useChannelData(channelId);

  // Handle document click
  const handleDocumentClick = (document: Document) => {
    console.log('Document clicked:', document);
    // TODO: Navigate to document view or open in modal
    if (document.canonicalUrl && document.docType === 'WEB') {
      window.open(document.canonicalUrl, '_blank');
    }
  };

  const fetchFollowStatus = async () => {
    if (!userChannels.length || userChannels.some(channel => channel.id === channelId)) {
      // Don't check follow status if no user channels or if this is user's own channel
      return;
    }

    try {
      const followerChannel = userChannels[0];
      const response = await makeApiRequest(
        buildApiUrl(`/api/v1/channels/${channelId}/follow-status?follower_id=${followerChannel.id}`),
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (response.ok) {
        const status = await response.json();
        setIsFollowing(status.is_following);
      }
    } catch (error) {
      console.warn('Failed to get follow status:', error);
    }
  };

  const fetchChannelInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await makeApiRequest(
        buildApiUrl(`/api/v1/channels/${channelId}`),
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch channel: ${response.status}`);
      }
      
      const data = await response.json();
      setChannelInfo(data);
    } catch (err) {
      console.error('Channel fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load channel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (channelId) {
      fetchChannelInfo();
      fetchFollowStatus();
    }
  }, [channelId, userChannels]);

  const generateAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000000&color=ffffff&size=120&font-size=0.4&bold=true`;
  };

  const handleChatMessage = (message: string) => {
    console.log('Chat message from channel interface:', message);
    // Switch to chat view when user sends a message
    setCurrentView('chat');
  };

  const handleFollowToggle = async () => {
    if (!userChannels.length || followingInProgress) return;

    const userChannel = userChannels[0];
    const action = isFollowing ? 'unfollow' : 'follow';
    
    try {
      setFollowingInProgress(true);
      
      // Optimistic update
      setIsFollowing(!isFollowing);

      const response = await makeApiRequest(buildApiUrl(`/api/v1/channels/${userChannel.id}/follow`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          follower_id: userChannel.id,
          followed_id: channelId,
          action
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} channel`);
      }

      const result = await response.json();
      setIsFollowing(result.is_following);
      
      // Update followers count if provided
      if (result.followers_count !== undefined && channelInfo) {
        setChannelInfo(prev => prev ? { ...prev, followers_count: result.followers_count } : null);
      }

    } catch (error) {
      console.error('Follow action error:', error);
      // Revert optimistic update on error
      setIsFollowing(isFollowing);
    } finally {
      setFollowingInProgress(false);
    }
  };

  const handleViewSwitch = (view: 'channel' | 'chat') => {
    setCurrentView(view);
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden h-full">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-4 h-full flex flex-col">
        
        {/* Main Layout Container - Ultra Clean */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] flex-1 flex flex-col min-h-0"
        >
          
          {/* Main Content Layout */}
          <div className="flex flex-1 min-h-0">
            
            {/* Main Dashboard Area */}
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* TITLE AREA - Ultra-Thin One-Line Layout */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="border-b border-gray-50 px-6 py-3 bg-gradient-to-b from-gray-50/30 to-transparent"
              >
                {loading ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-50 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-between">
                    <div className="text-gray-900 text-sm font-light">Unable to load channel: {error}</div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={fetchChannelInfo}
                      className="px-4 py-1 bg-black text-white rounded text-xs font-medium hover:bg-gray-900 transition-colors duration-200"
                    >
                      Retry
                    </motion.button>
                  </div>
                ) : channelInfo ? (
                  <div className="flex items-center justify-between">
                    
                    {/* Left: Ultra-Compact Channel Identity */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="flex items-center space-x-3 flex-1 min-w-0"
                    >
                      {/* Tiny Avatar */}
                      <div className="relative group flex-shrink-0">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                          className="relative"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 group-hover:border-gray-300 transition-colors duration-200">
                            <img
                              className="w-full h-full object-cover"
                              src={generateAvatarUrl(channelInfo.name)}
                              alt={channelInfo.name}
                            />
                          </div>
                          
                          {/* Status Indicator */}
                          <div className="absolute -bottom-1 -right-1">
                            <div className={`w-3 h-3 rounded-full border-2 border-white ${
                              channelInfo.is_active ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                          </div>
                        </motion.div>
                      </div>

                      {/* Channel Information */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <motion.h1
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.35 }}
                            className="text-2xl font-bold text-gray-900"
                          >
                            {channelInfo.name}
                          </motion.h1>
                          
                          <motion.span
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="text-sm text-gray-500 font-light"
                          >
                            {channelInfo.channel_handle}
                          </motion.span>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Right: Conditional Stats */}
                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.45 }}
                      className="flex items-center space-x-4 flex-shrink-0"
                    >
                      {/* Conditional Follow Button - Only show if not current user's channel */}
                      {!userChannels.some(channel => channel.id === channelInfo.id) && (
                        <motion.button
                          onClick={handleFollowToggle}
                          disabled={followingInProgress}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                            isFollowing
                              ? 'bg-white/20 text-gray-700 hover:bg-white/30 border border-gray-300'
                              : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
                          } ${
                            followingInProgress ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {followingInProgress ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                              />
                              <span>Processing</span>
                            </>
                          ) : isFollowing ? (
                            <>
                              <Heart className="w-4 h-4 fill-current" />
                              <span>Following</span>
                            </>
                          ) : (
                            <>
                              <Star className="w-4 h-4" />
                              <span>Follow</span>
                            </>
                          )}
                        </motion.button>
                      )}
                      
                      {/* Followers Count */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center group cursor-pointer px-2"
                      >
                        <span className="text-sm font-medium text-gray-500 group-hover:text-gray-600 mb-1">
                          followers
                        </span>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-gray-500 group-hover:text-gray-700" strokeWidth={1.5} />
                          <span className="text-lg font-bold text-gray-700 group-hover:text-gray-900">
                            {channelInfo.followers_count?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </motion.div>
                      
                      {/* Vertical Separator */}
                      <div className="h-12 w-px bg-gray-200"></div>
                      
                      {/* Staking */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center group cursor-pointer px-2"
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-500 group-hover:text-gray-600">
                            Staking
                          </span>
                          {/* Conditional Stake Button - Only show if current user's channel */}
                          {userChannels.some(channel => channel.id === channelInfo.id) && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-2 py-0.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-colors duration-200"
                            >
                              Stake
                            </motion.button>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Coins className="w-4 h-4 text-gray-500 group-hover:text-gray-700" strokeWidth={1.5} />
                          <span className="text-lg font-bold text-gray-700 group-hover:text-gray-900">
                            {((channelInfo.rep_score || 0) / 1000).toFixed(3)} ETH
                          </span>
                        </div>
                      </motion.div>

                      {/* Vertical Separator */}
                      <div className="h-12 w-px bg-gray-200"></div>

                      {/* View Toggle Buttons */}
                      <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleViewSwitch('channel')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                            currentView === 'channel'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Overview
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleViewSwitch('chat')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                            currentView === 'chat'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Chat
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <h1 className="text-lg font-medium text-gray-900">{channelId}</h1>
                )}
              </motion.div>
              
              {/* MAIN AREA - Dynamic Content Based on Current View */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex-1 min-h-0"
              >
                {currentView === 'channel' ? (
                  <ChannelInterface
                    channelId={channelId}
                    channelInfo={channelInfo}
                    loading={loading}
                    onChatMessage={handleChatMessage}
                    onViewSwitch={handleViewSwitch}
                  />
                ) : (
                  <ChatInterface
                    channelId={channelId}
                    channelName={channelInfo?.name}
                    className="h-full"
                  />
                )}
              </motion.div>
            </div>

            {/* Minimal Vertical Divider */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="w-px bg-gray-100"
            />

            {/* RIGHT SIDE PANEL - Split into Content and Version Timeline */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="w-96 bg-gradient-to-b from-gray-50/40 via-indigo-50/20 to-purple-50/20 flex flex-col backdrop-blur-sm resize-x overflow-hidden min-w-80 max-w-2xl"
            >
              {/* TOP HALF - Folder Tree */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Sidebar Header */}
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="border-b border-gray-100/80 px-6 py-4 bg-gradient-to-r from-white/80 to-indigo-50/30 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg blur-sm opacity-20" />
                        <FolderTreeIcon className="w-5 h-5 text-indigo-600 relative z-10 drop-shadow-sm" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 tracking-wide">Content</h3>
                    </div>
                    
                    {/* Sync Controls */}
                    <div className="flex items-center space-x-1">
                      {lastSyncTime && (
                        <span className="text-xs text-gray-500" title={`Last sync: ${lastSyncTime.toLocaleTimeString()}`}>
                          {Math.floor((Date.now() - lastSyncTime.getTime()) / 60000)}m
                        </span>
                      )}
                      
                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(99, 102, 241, 0.1)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => syncData()}
                        disabled={dataLoading}
                        className="p-2 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-all duration-200 border border-transparent hover:border-indigo-200/50"
                        title="Sync with backend"
                      >
                        <RefreshCw className={`w-4 h-4 text-indigo-500 ${dataLoading ? 'animate-spin' : ''}`} strokeWidth={2} />
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center space-x-6 mt-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full" />
                      <span className="text-xs text-gray-600 font-medium">{folders.length} folders</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
                      <span className="text-xs text-gray-600 font-medium">{documents.length} documents</span>
                    </div>
                  </div>
                </motion.div>

                {/* Folder Tree Content */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  className="flex-1 overflow-y-auto min-h-0"
                >
                  <div className="p-4">
                    {dataLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <RefreshCw className="w-8 h-8 text-gray-300 animate-spin mb-4" strokeWidth={1} />
                        <p className="text-sm text-gray-400">Loading content...</p>
                      </div>
                    ) : dataError ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Circle className="w-8 h-8 text-red-300 mb-4" strokeWidth={1} />
                        <p className="text-sm text-red-400 mb-2">Failed to load</p>
                        <p className="text-xs text-gray-400 mb-4">{dataError}</p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => refetchData()}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition-colors duration-200"
                        >
                          Retry
                        </motion.button>
                      </div>
                    ) : (
                      <FolderTree
                        folders={folders}
                        documents={documents}
                        onDocumentClick={handleDocumentClick}
                      />
                    )}
                  </div>
                </motion.div>
              </div>

              {/* BOTTOM HALF - Recent Updates with Dropdown */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="border-t border-gray-100/80"
              >
                {/* Recent Updates Header with Dropdown Toggle */}
                <motion.div
                  className="px-6 py-4 bg-gradient-to-r from-white/80 to-purple-50/30 backdrop-blur-sm cursor-pointer"
                  onClick={() => setShowRecentUpdates(!showRecentUpdates)}
                  whileHover={{ backgroundColor: "rgba(147, 51, 234, 0.02)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg blur-sm opacity-20" />
                        <motion.div
                          animate={{ rotate: showRecentUpdates ? 180 : 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <ChevronDown className="w-5 h-5 text-purple-600 relative z-10 drop-shadow-sm" strokeWidth={1.5} />
                        </motion.div>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 tracking-wide">Recent Updates</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        AI Analysis
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Expandable Recent Updates Content */}
                <AnimatePresence>
                  {showRecentUpdates && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="h-96">
                        <RecentUpdates channelId={channelId} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

          </div>
        </motion.div>
      </div>
      
      {/* Custom Styles */}
      <style jsx>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

export default function ChannelProfilePage() {
  return (
    <AuthProvider>
      <DataProvider>
        <LoginTriggerProvider>
          <div className="h-screen bg-gray-50 flex flex-col">
            <Header />
            <ChannelContent />
          </div>
        </LoginTriggerProvider>
      </DataProvider>
    </AuthProvider>
  );
}