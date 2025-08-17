'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';
import DataProvider from '../../../components/auth/DataProvider';
import LoginTriggerProvider from '../../../components/auth/LoginTriggerContext';
import Header from '../../../components/Header';
import { useUserData } from '../../../components/auth/DataProvider';
import { Users, Star, Circle, RefreshCw, FolderTree as FolderTreeIcon, ExternalLink, Coins, DollarSign, BarChart3, Brain } from 'lucide-react';
import FolderTree from '../../../components/FolderTree';
import ChatInterface from '../../../components/ChatInterface';
import ChannelInterface from '../../../components/ChannelInterface';
import { useChannelData } from '../../../hooks/useChannelData';
import type { Document } from '../../../components/FolderTree';
import { useX402Client } from '../../../lib/x402-client';
import { usePrivy } from '@privy-io/react-auth';

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
  
  // Privy and x402 integration
  const { authenticated } = usePrivy();
  const { 
    client, 
    makePaymentRequest, 
    isClientReady
  } = useX402Client();
  
  // Payment state
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [paymentResults, setPaymentResults] = useState<Record<string, any>>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  
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

  const handleChatMessage = (message: string) => {
    console.log('Chat message from channel interface:', message);
    // Switch to chat view when user sends a message
    setCurrentView('chat');
  };

  const handleViewSwitch = (view: 'channel' | 'chat') => {
    setCurrentView(view);
  };

  // Payment request handler
  const makePayment = async (endpoint: string, method: string = 'GET', data?: unknown) => {
    console.log('makePayment called:', { endpoint, method, authenticated, isClientReady, hasClient: !!client });
    
    if (!authenticated) {
      setPaymentErrors(prev => ({ ...prev, [endpoint]: 'Please connect your wallet first to make payments.' }));
      return;
    }

    if (!isClientReady) {
      setPaymentErrors(prev => ({ ...prev, [endpoint]: 'Wallet not ready. Please ensure your wallet is connected and try again.' }));
      return;
    }

    if (!client) {
      setPaymentErrors(prev => ({ ...prev, [endpoint]: 'Payment client not initialized. Please refresh the page and try again.' }));
      return;
    }

    const key = `${method}-${endpoint}`;
    setPaymentLoading(key);
    
    // Clear previous results and errors
    setPaymentErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[endpoint];
      return newErrors;
    });
    
    setPaymentResults(prev => {
      const newResults = { ...prev };
      delete newResults[endpoint];
      return newResults;
    });

    try {
      console.log('About to call makePaymentRequest:', { endpoint, method });
      const result = await makePaymentRequest(endpoint, { method, data });
      console.log('Payment request successful:', result);
      setPaymentResults(prev => ({ ...prev, [endpoint]: result }));
    } catch (error: unknown) {
      console.error('Payment request failed:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status !== 402) {
          const errorMessage = axiosError.response?.data?.error || 'Unknown error occurred';
          setPaymentErrors(prev => ({ ...prev, [endpoint]: errorMessage }));
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setPaymentErrors(prev => ({ ...prev, [endpoint]: errorMessage }));
      }
    } finally {
      setPaymentLoading(null);
    }
  };

  const getCostForEndpoint = (endpoint: string): string => {
    const costs: Record<string, string> = {
      '/api/premium': '$0.01',
      '/api/analytics': '$0.05',
      '/api/ai-insights': '$0.10',
      'https://x402.payai.network/api/base-sepolia/paid-content': '$0.01'
    };
    return costs[endpoint] || 'Unknown';
  };

  const isPaymentLoading = (endpoint: string) => paymentLoading === `GET-${endpoint}`;

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
                transition={{ duration: 0.8 }}
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
                      transition={{ duration: 0.6 }}
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

                      {/* One-Line Channel Information */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline space-x-2 mb-1">
                          <motion.h1
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="text-2xl font-bold text-gray-900 truncate"
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
                      </div>
                    </motion.div>
                    
                    {/* Right: Conditional Stats */}
                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="flex items-center space-x-8 flex-shrink-0"
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
                        className="flex flex-col items-center group cursor-pointer px-4"
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
                        className="flex flex-col items-center group cursor-pointer px-4"
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
              
              {/* PAYMENT BUTTONS - x402 API Access */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="border-b border-gray-50 px-6 py-4 bg-gradient-to-r from-indigo-50/30 to-purple-50/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Premium API Access</h3>
                  {!authenticated && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      Connect wallet to enable payments
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  {/* Premium Content Button */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => makePayment('/api/premium', 'GET')}
                    disabled={!authenticated || !isClientReady || isPaymentLoading('/api/premium')}
                    className="flex items-center justify-between p-3 bg-white border border-green-200 rounded-lg hover:border-green-300 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600 group-hover:text-green-700" strokeWidth={2} />
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">Premium</div>
                        <div className="text-xs text-gray-500">Market data</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">$0.01</div>
                      <div className="text-xs text-gray-400">USDC</div>
                    </div>
                    {isPaymentLoading('/api/premium') && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                        <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
                      </div>
                    )}
                  </motion.button>

                  {/* Analytics Button */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => makePayment('/api/analytics', 'GET')}
                    disabled={!authenticated || !isClientReady || isPaymentLoading('/api/analytics')}
                    className="flex items-center justify-between p-3 bg-white border border-purple-200 rounded-lg hover:border-purple-300 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group relative"
                  >
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-purple-600 group-hover:text-purple-700" strokeWidth={2} />
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">Analytics</div>
                        <div className="text-xs text-gray-500">Advanced metrics</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-purple-600">$0.05</div>
                      <div className="text-xs text-gray-400">USDC</div>
                    </div>
                    {isPaymentLoading('/api/analytics') && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                      </div>
                    )}
                  </motion.button>

                  {/* AI Insights Button */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => makePayment('/api/ai-insights', 'GET')}
                    disabled={!authenticated || !isClientReady || isPaymentLoading('/api/ai-insights')}
                    className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg hover:border-orange-300 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group relative"
                  >
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-orange-600 group-hover:text-orange-700" strokeWidth={2} />
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">AI Insights</div>
                        <div className="text-xs text-gray-500">AI predictions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-orange-600">$0.10</div>
                      <div className="text-xs text-gray-400">USDC</div>
                    </div>
                    {isPaymentLoading('/api/ai-insights') && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                        <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
                      </div>
                    )}
                  </motion.button>
                  
                  {/* Test x402 Echo Server Button */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Use the x402 echo server for testing
                      const testEndpoint = 'https://x402.payai.network/api/base-sepolia/paid-content';
                      makePayment(testEndpoint, 'GET');
                    }}
                    disabled={!authenticated || !isClientReady || isPaymentLoading('https://x402.payai.network/api/base-sepolia/paid-content')}
                    className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-300 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group relative"
                  >
                    <div className="flex items-center space-x-2">
                      <Circle className="w-4 h-4 text-blue-600 group-hover:text-blue-700" strokeWidth={2} />
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">Test x402</div>
                        <div className="text-xs text-gray-500">Echo server</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-blue-600">$0.01</div>
                      <div className="text-xs text-gray-400">USDC</div>
                    </div>
                    {isPaymentLoading('https://x402.payai.network/api/base-sepolia/paid-content') && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      </div>
                    )}
                  </motion.button>
                </div>

                {/* Payment Results/Errors */}
                {Object.keys(paymentResults).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {Object.entries(paymentResults).map(([endpoint, result]) => (
                      <motion.div
                        key={endpoint}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-800">
                            ✅ {endpoint} - Success
                          </span>
                          <span className="text-xs text-green-600">
                            Cost: {getCostForEndpoint(endpoint)}
                          </span>
                        </div>
                        <pre className="text-xs text-green-700 bg-green-100 p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </motion.div>
                    ))}
                  </div>
                )}

                {Object.keys(paymentErrors).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {Object.entries(paymentErrors)
                      .filter(([, error]) => error && error.trim() !== '')
                      .map(([endpoint, error]) => (
                        <motion.div
                          key={endpoint}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-3 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <span className="text-sm font-medium text-red-800">
                            ❌ {endpoint} - Error
                          </span>
                          <p className="text-xs text-red-700 mt-1">{error}</p>
                        </motion.div>
                      ))}
                  </div>
                )}
              </motion.div>
              
              {/* MAIN AREA - Dynamic Content Based on Current View */}
              {currentView === 'channel' ? (
                <ChannelInterface
                  channelId={channelId}
                  channelInfo={channelInfo}
                  loading={loading}
                  onChatMessage={handleChatMessage}
                />
              ) : (
                <ChatInterface
                  channelId={channelId}
                  channelName={channelInfo?.name}
                />
              )}
            </div>

            {/* Minimal Vertical Divider */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="w-px bg-gray-100"
            />

            {/* RIGHT SIDE PANEL - Folder Tree */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="w-80 bg-gradient-to-b from-gray-50/40 via-indigo-50/20 to-purple-50/20 flex flex-col backdrop-blur-sm"
            >
              {/* Sidebar Header */}
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
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
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex-1 overflow-y-auto"
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
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ChannelProfilePage() {
  return (
    <DataProvider>
      <LoginTriggerProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <ChannelContent />
        </div>
      </LoginTriggerProvider>
    </DataProvider>
  );
}