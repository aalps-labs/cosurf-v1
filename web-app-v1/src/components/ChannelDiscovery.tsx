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
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  
  const CHANNELS_PER_PAGE = 12;

  // Fetch all channels once on component mount
  const fetchAllChannels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch a large number of channels to get all available channels
      const params = new URLSearchParams({
        size: '100', // Get a large number to fetch all channels
        is_active: 'true',
        sort_by: 'followers_count',
        sort_order: 'desc'
      });

      const apiUrl = buildApiUrl(`/api/v1/channels?${params.toString()}`);
      const response = await makeApiRequest(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch channels: ${response.status}`);
      }

      const data: ChannelSearchResponse = await response.json();
      
      setAllChannels(data.channels || []);
      setFilteredChannels(data.channels || []);
      
    } catch (err) {
      console.error('Channel fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch channels');
      setAllChannels([]);
      setFilteredChannels([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
    // TODO: Implement follow functionality when user authentication is available
    // This would require the current user's channel ID to perform the follow action
    
    try {
      // For now, just toggle the local state
      setFollowingStates(prev => ({
        ...prev,
        [channelId]: !prev[channelId]
      }));

      // Real implementation would be:
      // const userChannelId = getCurrentUserChannelId();
      // const action = followingStates[channelId] ? 'unfollow' : 'follow';
      // 
      // const response = await makeApiRequest(buildApiUrl(`/api/v1/channels/${channelId}/follow`), {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     follower_id: userChannelId,
      //     followed_id: channelId,
      //     action
      //   })
      // });

    } catch (err) {
      console.error('Follow action error:', err);
      // Revert the optimistic update on error
      setFollowingStates(prev => ({
        ...prev,
        [channelId]: !prev[channelId]
      }));
    }
  };

  // Load all channels on component mount
  useEffect(() => {
    fetchAllChannels();
  }, [fetchAllChannels]);

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
              onClick={() => fetchAllChannels()}
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
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        followingStates[channel.id]
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {followingStates[channel.id] ? 'Following' : 'Follow'}
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
