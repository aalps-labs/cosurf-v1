'use client';

import { useState, useEffect, useCallback } from 'react';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';
import { getCurrentAvatarUrl } from '@/lib/avatar-utils';
import { useRouter } from 'next/navigation';
import { useUserData } from './auth/DataProvider';
import { useLoginTrigger } from './auth/LoginTriggerContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Coins, Star, Sparkles, TrendingUp, Eye, Heart, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Channel {
  id: string;
  name: string;
  channel_handle: string;
  description?: string;
  created_at: string;
  is_active: boolean;
  followers_count?: number;
  rep_score?: number;
  user_id: string;
  is_following?: boolean;
  is_muted?: boolean;
}

interface ChannelSearchResponse {
  channels: Channel[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

interface FollowStatus {
  is_following: boolean;
  is_muted: boolean;
  followers_count: number;
}

export default function ChannelDiscovery() {
  const router = useRouter();
  const { userChannels, hasChannelData } = useUserData(); // Get user channels from global context
  const { triggerLogin } = useLoginTrigger();
  const [searchQuery, setSearchQuery] = useState('');
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [followingChannels, setFollowingChannels] = useState<Set<string>>(new Set());
  const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());
  const [failedAvatars, setFailedAvatars] = useState<Map<string, number>>(new Map());
  
  const CHANNELS_PER_PAGE = 12;

  // Markdown components configuration for descriptions
  const markdownComponents = {
    h1: ({ children }: any) => <h1 className="text-sm font-semibold text-gray-800 mb-1">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-sm font-medium text-gray-700 mb-1">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xs font-medium text-gray-700 mb-1">{children}</h3>,
    p: ({ children }: any) => <p className="text-gray-600 text-xs leading-relaxed mb-1">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside text-gray-600 text-xs space-y-0.5 mb-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside text-gray-600 text-xs space-y-0.5 mb-1">{children}</ol>,
    li: ({ children }: any) => <li className="text-gray-600 text-xs">{children}</li>,
    strong: ({ children }: any) => <strong className="font-semibold text-gray-700">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-gray-600">{children}</em>,
    code: ({ children }: any) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-gray-700">{children}</code>,
    a: ({ href, children }: any) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-indigo-600 hover:text-indigo-800 underline text-xs"
      >
        {children}
      </a>
    ),
    // Simplify other elements for compact display
    pre: ({ children }: any) => <div className="bg-gray-100 p-1 rounded text-xs font-mono text-gray-700 mb-1">{children}</div>,
    blockquote: ({ children }: any) => <div className="border-l-2 border-gray-300 pl-2 text-gray-600 text-xs mb-1">{children}</div>,
  };

  // User channels are now loaded globally via DataProvider

  // Fetch channels and following status (following the same pattern as the provided page.tsx)
  const fetchChannelsAndFollowStatus = useCallback(async () => {
    // Always fetch channels, but only fetch follow status if user has channels

    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting channel fetch...');
      
      // API Call 1: Fetch all channels (same as the provided code)
      const params = new URLSearchParams({
        size: '100',
        is_active: 'true',
        sort_by: 'followers_count',
        sort_order: 'desc'
      });

      const channelsUrl = buildApiUrl(`/api/v1/channels?${params.toString()}`);
      const channelsResponse = await makeApiRequest(channelsUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!channelsResponse.ok) {
        throw new Error(`Failed to fetch channels: ${channelsResponse.status}`);
      }

      const channelsData: ChannelSearchResponse = await channelsResponse.json();
      
      // Filter out user's own channels only if user has channels
      const userChannelIds = hasChannelData ? new Set(userChannels.map(channel => channel.id)) : new Set();
      const otherChannels = (channelsData.channels || []).filter(channel => 
        !userChannelIds.has(channel.id)
      );

      // Get follow status for each channel only if user has channels
      const followerChannel = hasChannelData ? userChannels[0] : null;
      const channelsWithFollowStatus: Channel[] = await Promise.all(
        otherChannels.slice(0, 20).map(async (channel) => {
          let followStatus = { is_following: false, is_muted: false };
          
          if (followerChannel && hasChannelData) {
            try {
              // Make individual follow status check (same as provided code)
              const response = await makeApiRequest(
                buildApiUrl(`/api/v1/channels/${channel.id}/follow-status?follower_id=${followerChannel.id}`),
                {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
              
              if (response.ok) {
                const status = await response.json();
                followStatus = {
                  is_following: status.is_following,
                  is_muted: status.is_muted
                };
              }
            } catch (error) {
              // If follow status check fails, default to not following (same as provided code)
              console.warn(`Failed to get follow status for channel ${channel.id}:`, error);
            }
          }

          return {
            ...channel,
            is_following: followStatus.is_following,
            is_muted: followStatus.is_muted
          };
        })
      );

      // Update following channels set for quick lookups
      const followingIds = new Set<string>(
        channelsWithFollowStatus
          .filter(channel => channel.is_following)
          .map(channel => channel.id)
      );

      // Update state only after all API calls complete
      setFollowingChannels(followingIds);
      setAllChannels(channelsWithFollowStatus);
      setFilteredChannels(channelsWithFollowStatus);
      
      console.log('✅ Channel fetch complete:', {
        total: channelsData.channels?.length || 0,
        userOwned: userChannelIds.size,
        showing: channelsWithFollowStatus.length,
        following: followingIds.size,
        hasChannelData
      });
      
    } catch (err) {
      console.error('Channel fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch channels');
      setAllChannels([]);
      setFilteredChannels([]);
      setFollowingChannels(new Set());
    } finally {
      setLoading(false);
    }
  }, [hasChannelData, userChannels]);

  // Client-side full-text search function
  const performClientSearch = useCallback((query: string) => {
    if (!query.trim()) {
      // If no search query, show all channels
      setFilteredChannels(allChannels);
      setPage(1);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    
    // Full-text search on channel name and handle
    const filtered = allChannels.filter(channel => {
      const nameMatch = channel.name.toLowerCase().includes(searchTerm);
      const handleMatch = channel.channel_handle.toLowerCase().includes(searchTerm);
      const descriptionMatch = channel.description?.toLowerCase().includes(searchTerm) || false;
      
      return nameMatch || handleMatch || descriptionMatch;
    });

    setFilteredChannels(filtered);
    setPage(1); // Reset to first page when searching
  }, [allChannels]);

  // Handle search input - no debouncing needed for client-side search
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    performClientSearch(query);
  }, [performClientSearch]);

  // Handle follow/unfollow action
  const handleFollowToggle = async (channelId: string) => {
    // Check if user has channel data first
    if (!hasChannelData) {
      console.log('User has no channel data, triggering login');
      triggerLogin();
      return;
    }

    const userChannel = userChannels[0]; // Use the first user channel as the follower
    // Find the channel and get its follow status
    const channel = allChannels.find(c => c.id === channelId);
    const isCurrentlyFollowing = channel?.is_following || false;
    const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
    
    // Prevent multiple simultaneous requests for the same channel
    if (followingInProgress.has(channelId)) {
      return;
    }
    
    try {
      // Set loading state
      setFollowingInProgress(prev => new Set(prev).add(channelId));
      
      // Optimistic update - update the channel's follow status
      setAllChannels(prev => prev.map(c => 
        c.id === channelId 
          ? { ...c, is_following: !isCurrentlyFollowing }
          : c
      ));
      setFilteredChannels(prev => prev.map(c => 
        c.id === channelId 
          ? { ...c, is_following: !isCurrentlyFollowing }
          : c
      ));

      // Make API call to follow/unfollow
      // According to API docs: PUT /channels/{channel_id}/follow where channel_id is the follower
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
      console.log(`✅ Successfully ${action}ed channel:`, result);

      // Update the channel with the server response
      if (result.is_following !== undefined) {
        setAllChannels(prev => prev.map(c => 
          c.id === channelId 
            ? { 
                ...c, 
                is_following: result.is_following,
                is_muted: result.is_muted,
                followers_count: result.followers_count || c.followers_count
              }
            : c
        ));
        setFilteredChannels(prev => prev.map(c => 
          c.id === channelId 
            ? { 
                ...c, 
                is_following: result.is_following,
                is_muted: result.is_muted,
                followers_count: result.followers_count || c.followers_count
              }
            : c
        ));
        
        // Update the following set for quick lookups
        const updatedFollowingChannels = new Set(followingChannels);
        if (result.is_following) {
          updatedFollowingChannels.add(channelId);
        } else {
          updatedFollowingChannels.delete(channelId);
        }
        setFollowingChannels(updatedFollowingChannels);
      }

    } catch (err) {
      console.error('Follow action error:', err);
      
      // Show user-friendly error message
      const errorMessage = err instanceof Error ? err.message : 'Failed to update follow status';
      console.warn(`Failed to ${action} channel:`, errorMessage);
      
      // Revert the optimistic update on error
      setAllChannels(prev => prev.map(c => 
        c.id === channelId 
          ? { ...c, is_following: isCurrentlyFollowing }
          : c
      ));
      setFilteredChannels(prev => prev.map(c => 
        c.id === channelId 
          ? { ...c, is_following: isCurrentlyFollowing }
          : c
      ));
      
      // You could also show a toast notification here
      // toast.error(`Failed to ${action} channel. Please try again.`);
    } finally {
      // Clear loading state
      setFollowingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(channelId);
        return newSet;
      });
    }
  };

  // Fetch channels always, follow status only when user has channel data
  useEffect(() => {
    fetchChannelsAndFollowStatus();
  }, [fetchChannelsAndFollowStatus]);

  // Calculate pagination for filtered results
  const totalPages = Math.ceil(filteredChannels.length / CHANNELS_PER_PAGE);
  const startIndex = (page - 1) * CHANNELS_PER_PAGE;
  const endIndex = startIndex + CHANNELS_PER_PAGE;
  const paginatedChannels = filteredChannels.slice(startIndex, endIndex);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Avatar logic is now handled by shared utility

  // Handle avatar load error
  const handleAvatarError = (channelId: string) => {
    setFailedAvatars(prev => {
      const newMap = new Map(prev);
      const currentFailures = newMap.get(channelId) || 0;
      newMap.set(channelId, currentFailures + 1);
      return newMap;
    });
  };

  // Handle channel card click to navigate to profile
  const handleChannelClick = (channelId: string) => {
    router.push(`/channels/${channelId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-white/90 text-sm font-medium">Discover Amazing Channels</span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-6"
          >
            Surf Search
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-white/70 mb-12 max-w-2xl mx-auto"
          >
            Explore a cosmos of creativity, connect with visionaries, and stake your claim in the future of content
          </motion.p>
          
          {!hasChannelData && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mb-8 p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-2xl max-w-2xl mx-auto"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">Unlock the Experience</span>
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-white/80">
                Sign in to follow channels, stake on creators, and get personalized recommendations tailored just for you
              </p>
            </motion.div>
          )}
          
          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-1">
                <div className="flex items-center">
                  <div className="pl-6 pr-3 flex items-center pointer-events-none">
                    <motion.div
                      animate={{ rotate: searchQuery ? 360 : 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Eye className="h-5 w-5 text-white/60" />
                    </motion.div>
                  </div>
                  <input
                    type="text"
                    placeholder="Search the channel universe..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="flex-1 py-4 bg-transparent text-white placeholder-white/50 focus:outline-none text-lg font-medium"
                  />
                  <div className="pr-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                    >
                      Explore
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-6"
              >
                <div className="w-full h-full border-4 border-purple-500/30 border-t-purple-500 rounded-full"></div>
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur-sm"
              ></motion.div>
            </div>
            <motion.p 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white/80 text-lg font-medium"
            >
              Discovering amazing channels...
            </motion.p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 max-w-md mx-auto">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="w-12 h-12 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center"
              >
                <Zap className="w-6 h-6 text-red-400" />
              </motion.div>
              <p className="text-red-300 mb-4 font-medium">{error}</p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchChannelsAndFollowStatus()}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
              >
                Try Again
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Channels Grid */}
        {!loading && !error && (
          <div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence>
                {paginatedChannels.map((channel, index) => (
                  <motion.div
                    key={channel.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group relative"
                  >
                    {/* Glow Effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    
                    {/* Main Card */}
                    <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden">
                      {/* Top Gradient Bar */}
                      <div className="h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500"></div>
                      
                      <div className="p-6">
                        {/* First Line: Avatar, Name, Handle, Follow Button */}
                        <div className="flex items-center justify-between mb-4">
                          <div 
                            className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer group/header"
                            onClick={() => handleChannelClick(channel.id)}
                          >
                            {/* Avatar with Glow */}
                            <div className="relative flex-shrink-0">
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                className="relative"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur opacity-50"></div>
                                <img
                                  className="relative h-12 w-12 rounded-xl object-cover border-2 border-white/30"
                                  src={getCurrentAvatarUrl(
                                    channel.id, 
                                    channel.name,
                                    failedAvatars.get(channel.id) || 0
                                  )}
                                  alt={channel.name}
                                  onError={() => handleAvatarError(channel.id)}
                                />
                              </motion.div>
                              
                              {/* Status Indicator */}
                              <motion.div 
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white/50 shadow-lg"
                              ></motion.div>
                            </div>
                            
                            {/* Channel Info */}
                            <div className="flex-1 min-w-0">
                              <motion.h3 
                                className="text-lg font-bold text-white group-hover/header:text-transparent group-hover/header:bg-gradient-to-r group-hover/header:from-purple-400 group-hover/header:to-cyan-400 group-hover/header:bg-clip-text transition-all duration-300 truncate"
                              >
                                {channel.name}
                              </motion.h3>
                              <p className="text-white/60 text-sm truncate">
                                {channel.channel_handle}
                              </p>
                            </div>
                          </div>
                          
                          {/* Follow Button */}
                          <motion.button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowToggle(channel.id);
                            }}
                            disabled={followingInProgress.has(channel.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 flex-shrink-0 ${
                              channel.is_following
                                ? 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                                : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
                            } ${
                              followingInProgress.has(channel.id)
                                ? 'opacity-50 cursor-not-allowed' 
                                : ''
                            }`}
                          >
                            {followingInProgress.has(channel.id) ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                                <span className="hidden sm:inline">Processing</span>
                              </>
                            ) : channel.is_following ? (
                              <>
                                <Heart className="w-4 h-4 fill-current" />
                                <span className="hidden sm:inline">Following</span>
                              </>
                            ) : (
                              <>
                                <Star className="w-4 h-4" />
                                <span className="hidden sm:inline">Follow</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                        
                        {/* Second Line: Followers and Staking Stats */}
                        <div className="flex items-center space-x-6">
                          {/* Followers */}
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center space-x-2 group/stat"
                          >
                            <div className="p-1.5 bg-white/10 rounded-lg group-hover/stat:bg-white/20 transition-colors">
                              <Users className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-white/50 text-xs">Followers</p>
                              <p className="text-white font-semibold text-sm">
                                {channel.followers_count?.toLocaleString() || 0}
                              </p>
                            </div>
                          </motion.div>
                          
                          {/* Staking */}
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center space-x-2 group/stat"
                          >
                            <div className="p-1.5 bg-white/10 rounded-lg group-hover/stat:bg-white/20 transition-colors">
                              <Coins className="w-3.5 h-3.5 text-yellow-400" />
                            </div>
                            <div>
                              <p className="text-white/50 text-xs">Staking</p>
                              <p className="text-white font-semibold text-sm">
                                {((channel.rep_score || 0) / 1000).toFixed(3)} ETH
                              </p>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                      
                      {/* Description Section */}
                      {channel.description && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          className="bg-white/95 backdrop-blur-sm border-t border-white/20 p-4"
                        >
                          <div className="prose prose-xs max-w-none line-clamp-3 overflow-hidden">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]} 
                              components={markdownComponents}
                            >
                              {channel.description}
                            </ReactMarkdown>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Hover Overlay */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 pointer-events-none"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-16 flex justify-center"
              >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2">
                  <nav className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Previous
                    </motion.button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                      return (
                        <motion.button
                          key={pageNum}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            pageNum === page
                              ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {pageNum}
                        </motion.button>
                      );
                    })}
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className="px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Next
                    </motion.button>
                  </nav>
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {filteredChannels.length === 0 && searchQuery && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center py-20"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="mx-auto w-24 h-24 mb-8 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20"
                >
                  <Eye className="w-12 h-12 text-white/60" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-4">No Channels Found</h3>
                <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
                  The universe is vast, but we couldn&apos;t find channels matching &quot;{searchQuery}&quot;. Try exploring different terms.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSearchChange('')}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                >
                  Clear Search
                </motion.button>
              </motion.div>
            )}
          </div>
        )}
      </div>
      
      {/* Custom Styles */}
      <style jsx>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .prose-xs {
          font-size: 0.75rem;
          line-height: 1rem;
        }
        .prose-xs p {
          margin-bottom: 0.25rem;
        }
        .prose-xs h1, .prose-xs h2, .prose-xs h3 {
          margin-bottom: 0.25rem;
          margin-top: 0;
        }
        .prose-xs ul, .prose-xs ol {
          margin-bottom: 0.25rem;
          margin-top: 0;
        }
      `}</style>
    </div>
  );
}
