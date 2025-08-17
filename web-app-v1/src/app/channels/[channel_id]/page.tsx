'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';
import AuthProvider from '../../../components/auth/AuthProvider';
import DataProvider from '../../../components/auth/DataProvider';
import LoginTriggerProvider from '../../../components/auth/LoginTriggerContext';
import Header from '../../../components/Header';
import { useUserData } from '../../../components/auth/DataProvider';
import { Users, Star, Circle } from 'lucide-react';

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

  const generateAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000000&color=ffffff&size=120&font-size=0.4&bold=true`;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        
        {/* Main Layout Container - Ultra Clean */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]"
        >
          
          {/* Main Content Layout */}
          <div className="flex min-h-[85vh]">
            
            {/* Main Dashboard Area */}
            <div className="flex-1 flex flex-col">
              
              {/* TITLE AREA - Ultra-Thin One-Line Layout */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
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
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 group-hover:border-gray-300 transition-colors duration-200">
                            <img
                              className="w-full h-full object-cover"
                              src={generateAvatarUrl(channelInfo.name)}
                              alt={channelInfo.name}
                            />
                          </div>
                          
                          {/* Tiny Status Indicator */}
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <div className={`w-2.5 h-2.5 rounded-full border border-white ${
                              channelInfo.is_active ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                          </div>
                        </motion.div>
                      </div>

                      {/* One-Line Channel Information */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline space-x-2 mb-1">
                          <motion.h1
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="text-lg font-medium text-gray-900 truncate"
                          >
                            {channelInfo.name}
                          </motion.h1>
                          
                          <motion.span
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="text-sm text-gray-500 font-light flex-shrink-0"
                          >
                            ({channelInfo.channel_handle})
                          </motion.span>
                        </div>
                        
                        {channelInfo.description && (
                          <motion.p
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="text-xs text-gray-600 font-light truncate"
                          >
                            {channelInfo.description}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                    
                    {/* Right: Conditional Stats */}
                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="flex items-center space-x-4 flex-shrink-0"
                    >
                      {/* Conditional Follow Button - Only show if not current user's channel */}
                      {!userChannels.some(channel => channel.id === channelInfo.id) && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1 bg-black text-white rounded text-xs font-medium hover:bg-gray-900 transition-colors duration-200"
                        >
                          Follow
                        </motion.button>
                      )}
                      
                      {/* Followers Count */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center space-x-1 group cursor-pointer"
                      >
                        <Users className="w-3 h-3 text-gray-500 group-hover:text-gray-700" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          {channelInfo.followers_count?.toLocaleString() || '0'}
                        </span>
                      </motion.div>
                      
                      {/* Reputation Score */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center space-x-1 group cursor-pointer"
                      >
                        <Star className="w-3 h-3 text-gray-500 group-hover:text-gray-700" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          {channelInfo.rep_score || '0'}
                        </span>
                      </motion.div>
                    </motion.div>
                  </div>
                ) : (
                  <h1 className="text-lg font-medium text-gray-900">{channelId}</h1>
                )}
              </motion.div>
              
              {/* MAIN AREA - Cleared with Elegant Minimalism */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex-1 p-12 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="text-center max-w-md"
                >
                  <div className="w-16 h-16 mx-auto mb-8 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Circle className="w-16 h-16 text-gray-200" strokeWidth={0.5} />
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-light text-gray-400 mb-4 tracking-wide">
                    CONTENT SPACE
                  </h3>
                  <p className="text-gray-300 font-light leading-relaxed">
                    This area is ready for your content to shine with perfect clarity and focus.
                  </p>
                </motion.div>
              </motion.div>
            </div>

            {/* Minimal Vertical Divider */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="w-px bg-gray-100"
            />

            {/* RIGHT SIDE PANEL - Ultra Clean */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="w-80 p-12 flex items-center justify-center bg-gray-50/30"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                  </motion.div>
                </div>
                <h3 className="text-lg font-light text-gray-400 mb-4 tracking-wide">
                  SIDEBAR
                </h3>
                <p className="text-gray-300 font-light text-sm leading-relaxed">
                  Clean space reserved for navigation and supplementary content.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ChannelProfilePage() {
  return (
    <AuthProvider>
      <DataProvider>
        <LoginTriggerProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <ChannelContent />
          </div>
        </LoginTriggerProvider>
      </DataProvider>
    </AuthProvider>
  );
}