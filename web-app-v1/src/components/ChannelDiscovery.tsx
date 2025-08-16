'use client';

import { useState, useEffect, useCallback } from 'react';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [userChannels, setUserChannels] = useState<Channel[]>([]);
  const [followingChannels, setFollowingChannels] = useState<Set<string>>(new Set());
  const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());
  
  const CHANNELS_PER_PAGE = 12;

  // Load user's connected channels from localStorage (no API call needed)
  const loadUserChannels = useCallback(() => {
    try {
      const connectedChannels = localStorage.getItem('connected_channels');
      if (connectedChannels) {
        const channels: Channel[] = JSON.parse(connectedChannels);
        setUserChannels(channels);
        console.log('📊 Loaded user channels from localStorage:', channels.length);
        return channels;
      }
    } catch (error) {
      console.warn('Failed to load user channels from localStorage:', error);
    }
    return [];
  }, []);

  // Fetch channels and following status (following the same pattern as the provided page.tsx)
  const fetchChannelsAndFollowStatus = useCallback(async () => {
    if (userChannels.length === 0) {
      console.log('⏳ No user channels loaded yet, skipping fetch');
      return;
    }

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
      
      // Filter out user's own channels (same as provided code)
      const userChannelIds = new Set(userChannels.map(channel => channel.id));
      const otherChannels = (channelsData.channels || []).filter(channel => 
        !userChannelIds.has(channel.id)
      );

      // Get follow status for each channel (following the exact pattern from provided code)
      const followerChannel = userChannels[0]; // Use first user channel as follower
      const channelsWithFollowStatus: Channel[] = await Promise.all(
        otherChannels.slice(0, 20).map(async (channel) => {
          let followStatus = { is_following: false, is_muted: false };
          
          if (followerChannel) {
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
        following: followingIds.size
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
  }, [userChannels]);

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
    if (userChannels.length === 0) {
      console.warn('No user channels available for following');
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

  // Load user channels on component mount
  useEffect(() => {
    loadUserChannels();
  }, [loadUserChannels]);

  // Fetch channels and follow status when user channels are loaded
  useEffect(() => {
    if (userChannels.length > 0) {
      fetchChannelsAndFollowStatus();
    }
  }, [userChannels, fetchChannelsAndFollowStatus]);

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

  const generateAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=48`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Discover Channels
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Find and follow channels that match your interests
        </p>
        
        {userChannels.length === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> You need to connect your channels to follow other channels. 
              Please complete your account setup first.
            </p>
          </div>
        )}
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search channels by name or description..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading channels...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => fetchChannelsAndFollowStatus()}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Channels Grid */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedChannels.map((channel) => (
              <div key={channel.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        className="h-12 w-12 rounded-full object-cover"
                        src={generateAvatarUrl(channel.name)}
                        alt={channel.name}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {channel.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        @{channel.channel_handle}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {channel.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {channel.followers_count?.toLocaleString() || 0}
                      </span>
                      <span>{formatDate(channel.created_at)}</span>
                    </div>
                    
                    <button 
                      onClick={() => handleFollowToggle(channel.id)}
                      disabled={userChannels.length === 0 || followingInProgress.has(channel.id)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                        channel.is_following
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } ${
                        userChannels.length === 0 || followingInProgress.has(channel.id)
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                    >
                      {followingInProgress.has(channel.id) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      )}
                      {followingInProgress.has(channel.id) 
                        ? 'Processing...' 
                        : channel.is_following 
                          ? 'Following' 
                          : 'Follow'
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        pageNum === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}

          {/* Empty State */}
          {filteredChannels.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No channels found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
