'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';
import AuthProvider from '../../../components/auth/AuthProvider';
import DataProvider from '../../../components/auth/DataProvider';
import Header from '../../../components/Header';
import { useUserData } from '../../../components/auth/DataProvider';

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
    }
  }, [channelId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=96`;
  };

  return (
    <>
      {/* Main Dashboard Area - Left side */}
      <div className="flex-1">
        {/* Channel Name Header - Only spans main area */}
        <div className="border-b border-gray-200 px-6 py-4">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Channel</h1>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchChannelInfo}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : channelInfo ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  className="h-16 w-16 rounded-full object-cover"
                  src={generateAvatarUrl(channelInfo.name)}
                  alt={channelInfo.name}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {channelInfo.name}
                  </h1>
                  <p className="text-sm text-gray-500">{channelInfo.channel_handle}</p>
                  {channelInfo.description && (
                    <p className="text-sm text-gray-600 mt-1">{channelInfo.description}</p>
                  )}
                </div>
              </div>
              
              {/* Stats with Icons */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-lg font-semibold text-gray-700">
                    {channelInfo.followers_count?.toLocaleString() || 0}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span className="text-lg font-semibold text-gray-700">
                    {channelInfo.rep_score || 0}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">{channelId}</h1>
          )}
        </div>
        
        {/* Main Content - Cleared as requested */}
        <div className="p-6 min-h-96">
          {/* Main area cleared as requested */}
        </div>
      </div>
    </>
  );
}

export default function ChannelProfilePage() {
  return (
    <AuthProvider>
      <DataProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Main Layout Container - Single merged container */}
            <div className="bg-white rounded-lg shadow-md">
              
              {/* Main Content with Vertical Divider */}
              <div className="flex">
                
                <ChannelContent />

                {/* Vertical Divider */}
                <div className="border-r border-gray-200"></div>

                {/* Right Side Panel - Cleared as requested */}
                <div className="w-80 p-6">
                  {/* Panel cleared as requested */}
                </div>

              </div>

            </div>
          </div>
        </div>
      </DataProvider>
    </AuthProvider>
  );
}