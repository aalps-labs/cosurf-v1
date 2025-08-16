'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

interface Channel {
  id: string;
  name: string;
  channel_handle: string;
  description: string;
  followers_count: number;
  rep_score: number;
  created_at: string;
  ownership: {
    auth_type: string;
    user_id: string;
    user_name: string;
    user_email: string;
    privy_id?: string | null;
    is_clerk_user: boolean;
    is_privy_user: boolean;
  };
}

interface ChannelConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type FlowStep = 'creating_user' | 'checking_privy_channels' | 'email_input' | 'searching_channels' | 'showing_channels' | 'connecting_channels' | 'completed' | 'error';

export default function ChannelConnectionModal({ isOpen, onClose, onComplete }: ChannelConnectionModalProps) {
  const { user, logout } = usePrivy();
  const [currentStep, setCurrentStep] = useState<FlowStep>('creating_user');
  

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [emailInput, setEmailInput] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  // Start the flow when modal opens
  useEffect(() => {
    if (isOpen && user) {
      startChannelConnectionFlow();
    }
  }, [isOpen, user]);

  const startChannelConnectionFlow = async () => {
    try {
      setCurrentStep('creating_user');
      setProgress(10);
      setStatusMessage('Setting up your account...');
      setErrorMessage('');

      // Step 1: Create/Update Privy user
      const userResponse = await fetch('/api/v1/user_new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privy_data: user })
      });

      if (!userResponse.ok) {
        throw new Error('Failed to create user account');
      }

      const userData = await userResponse.json();
      setUserId(userData.user?.id || userData.id);
      setProgress(25);

      // Step 2: Search for existing channels using new combined API
      setCurrentStep('checking_privy_channels');
      setStatusMessage('Checking for existing channels...');
      setProgress(40);

      // Prepare search criteria - prioritize Privy ID, include email if available
      const searchCriteria: any = {};
      if (user?.id) {
        searchCriteria.privy_id = user.id;
      }
      if (user?.email?.address) {
        searchCriteria.email = user.email.address;
        setSearchEmail(user.email.address);
      }

      console.log('🔍 Searching channels with criteria:', searchCriteria);

      const channelResponse = await fetch('/api/v1/user_new/search-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchCriteria)
      });

      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        
        if (channelData.channels && channelData.channels.length > 0) {
          // Found channels - check if any are connected to this Privy ID
          const privyConnectedChannels = channelData.channels.filter((channel: Channel) => 
            channel.ownership?.privy_id === user?.id
          );

          if (privyConnectedChannels.length > 0) {
            // Found channels already connected to this Privy ID
            setChannels(privyConnectedChannels);
            setCurrentStep('completed');
            setStatusMessage(`Welcome back! Found ${privyConnectedChannels.length} connected channels.`);
            setProgress(100);
            return;
          } else {
            // Found channels by email but not connected to this Privy ID
            setChannels(channelData.channels);
            setCurrentStep('showing_channels');
            setStatusMessage(`Found ${channelData.channels.length} channels for your account`);
            setProgress(85);
            // Auto-select all channels for connection
            setSelectedChannels(new Set(channelData.channels.map((c: Channel) => c.id)));
            return;
          }
        }
      }

      // Step 3: No channels found, check if we need email input
      if (!user?.email?.address) {
        // No email available, ask user to input email
        setCurrentStep('email_input');
        setStatusMessage('To find your existing channels, please enter your email address');
        setProgress(50);
      } else {
        // Had email but no results, show empty state
        setChannels([]);
        setCurrentStep('showing_channels');
        setStatusMessage(`No existing channels found for ${user.email.address}`);
        setProgress(100);
      }
    } catch (error) {
      setCurrentStep('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      setProgress(0);
    }
  };

  const searchChannelsByEmail = async (email: string) => {
    try {
      setCurrentStep('searching_channels');
      setStatusMessage(`Looking for channels associated with ${email}...`);
      setProgress(70);

      // Use the new combined search API with both email and privy_id if available
      const searchCriteria: any = { email };
      if (user?.id) {
        searchCriteria.privy_id = user.id;
      }

      console.log('🔍 Manual email search with criteria:', searchCriteria);

      const channelResponse = await fetch('/api/v1/user_new/search-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchCriteria)
      });

      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        setChannels(channelData.channels || []);
        setProgress(85);

        if (channelData.channels && channelData.channels.length > 0) {
          // Check if any channels are already connected to this Privy ID
          const privyConnectedChannels = channelData.channels.filter((channel: Channel) => 
            channel.ownership?.privy_id === user?.id
          );

          if (privyConnectedChannels.length > 0) {
            // Found channels already connected to this Privy ID
            setCurrentStep('completed');
            setStatusMessage(`Welcome back! Found ${privyConnectedChannels.length} connected channels.`);
            setChannels(privyConnectedChannels);
            setProgress(100);
            return;
          } else {
            // Found channels by email but not connected to this Privy ID
            setCurrentStep('showing_channels');
            setStatusMessage(`Found ${channelData.channels.length} channels for ${email}`);
            // Auto-select all channels for connection
            setSelectedChannels(new Set(channelData.channels.map((c: Channel) => c.id)));
          }
        } else {
          setCurrentStep('showing_channels');
          setStatusMessage(`No existing channels found for ${email}`);
          setProgress(100);
        }
      } else {
        throw new Error('Failed to search for channels');
      }
    } catch (error) {
      setCurrentStep('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to search for channels');
      setProgress(0);
    }
  };

  const handleEmailSubmit = () => {
    if (emailInput.trim()) {
      setSearchEmail(emailInput.trim());
      searchChannelsByEmail(emailInput.trim());
    }
  };

  const handleChannelSelection = (channelId: string) => {
    const newSelection = new Set(selectedChannels);
    if (newSelection.has(channelId)) {
      newSelection.delete(channelId);
    } else {
      newSelection.add(channelId);
    }
    setSelectedChannels(newSelection);
  };

  // Clear all cached data and auth info (similar to LoginButton)
  const clearAllData = async () => {
    try {
      console.log('🧹 Clearing all auth and channel data...');
      
      // Clear localStorage items (including all Privy-related data)
      const keysToRemove = [
        'privy:token',
        'privy:refresh_token',
        'privy:access_token',
        'privy:id_token',
        'privy:user',
        'privy:wallet_connection',
        'user_channels',
        'channel_data',
        'user_profile',
        'temp_user_data',
        'channel_search_results'
      ];
      
      keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`🗑️ Cleared localStorage: ${key}`);
        }
      });
      
      // Clear all Privy-prefixed items from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('privy:') || key.startsWith('privy_')) {
          localStorage.removeItem(key);
          console.log(`🗑️ Cleared Privy localStorage: ${key}`);
        }
      });
      
      // Clear sessionStorage as well
      const sessionKeys = ['temp_user_data', 'channel_search_results', 'auth_state'];
      sessionKeys.forEach(key => {
        if (sessionStorage.getItem(key)) {
          sessionStorage.removeItem(key);
          console.log(`🗑️ Cleared sessionStorage: ${key}`);
        }
      });
      
      // Clear all Privy-prefixed items from sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('privy:') || key.startsWith('privy_')) {
          sessionStorage.removeItem(key);
          console.log(`🗑️ Cleared Privy sessionStorage: ${key}`);
        }
      });
      
      // Reset component state
      setChannels([]);
      setSelectedChannels(new Set());
      setUserId('');
      setSearchEmail('');
      setEmailInput('');
      setStatusMessage('');
      setErrorMessage('');
      setProgress(0);
      setCurrentStep('creating_user');
      
      console.log('✅ All data cleared successfully');
    } catch (error) {
      console.warn('Failed to clear some data:', error);
    }
  };

  // Handle modal close with complete logout
  const handleModalClose = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to exit? This will log you out completely and you\'ll need to start over.'
    );
    
    if (confirmed) {
      console.log('❌ User confirmed close - performing complete logout');
      
      // First clear all data
      await clearAllData();
      
      // Then logout from Privy (this clears wallet connection and user session)
      try {
        await logout();
        console.log('🚪 Privy logout completed');
      } catch (error) {
        console.warn('Privy logout error:', error);
      }
      
      // Close the modal
      onClose();
    }
  };

  const connectSelectedChannels = async () => {
    try {
      setCurrentStep('connecting_channels');
      setStatusMessage('Connecting your channels...');
      setProgress(90);

      const selectedChannelList = channels.filter(c => selectedChannels.has(c.id));
      
      for (const channel of selectedChannelList) {
        // Check for conflicts
        const conflictResponse = await fetch(
          `/api/v1/user_new/${userId}/check-channel-conflict?channel_id=${channel.id}`,
          { method: 'POST' }
        );
        
        if (conflictResponse.ok) {
          // Connect the channel
          await fetch(`/api/v1/user_new/${userId}/connect-channel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel_id: channel.id })
          });
        }
      }

      setCurrentStep('completed');
      setStatusMessage(`Successfully connected ${selectedChannels.size} channels!`);
      setProgress(100);
      
      // Don't auto-close, let user manually close
    } catch (error) {
      setCurrentStep('error');
      setErrorMessage('Failed to connect channels. Please try again.');
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 relative">
          {/* Close Button */}
          <button
            onClick={handleModalClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            type="button"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-xl font-bold pr-8">Completing Your Setup</h2>
          <p className="text-blue-100 text-sm mt-1">
            {searchEmail ? `Setting up account for ${searchEmail}` : 
             user?.email?.address ? `Setting up account for ${user.email.address}` : 
             'Setting up your account'}
          </p>
          
          {/* Progress Bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Creating User Step */}
          {currentStep === 'creating_user' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Setting Up Your Account</h3>
              <p className="text-gray-600">{statusMessage}</p>
            </div>
          )}

          {/* Checking Privy Channels Step */}
          {currentStep === 'checking_privy_channels' && (
            <div className="text-center">
              <div className="animate-pulse">
                <div className="flex justify-center mb-4">
                  <div className="bg-purple-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Checking Your Account</h3>
              <p className="text-gray-600">{statusMessage}</p>
            </div>
          )}

          {/* Email Input Step */}
          {currentStep === 'email_input' && (
            <div>
              <div className="text-center mb-6">
                <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Your Channels</h3>
                <p className="text-gray-600 text-sm">{statusMessage}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll search for channels associated with this email address
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleEmailSubmit}
                    disabled={!emailInput.trim()}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Search Channels
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Searching Channels Step */}
          {currentStep === 'searching_channels' && (
            <div className="text-center">
              <div className="animate-pulse">
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Searching for Your Channels</h3>
              <p className="text-gray-600">{statusMessage}</p>
            </div>
          )}

          {/* Showing Channels Step */}
          {currentStep === 'showing_channels' && (
            <div>
              {channels.length > 0 ? (
                // Found channels - show selection interface
                <>
                  <div className="text-center mb-6">
                    <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Channels</h3>
                    <p className="text-gray-600 text-sm">{statusMessage}</p>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {channels.map((channel) => (
                      <div 
                        key={channel.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          selectedChannels.has(channel.id) 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleChannelSelection(channel.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedChannels.has(channel.id)}
                                onChange={() => handleChannelSelection(channel.id)}
                                className="mr-3 text-blue-500"
                              />
                              <div>
                                <h4 className="font-semibold text-gray-900">{channel.name}</h4>
                                <p className="text-blue-600 text-sm">{channel.channel_handle}</p>
                              </div>
                            </div>
                            <p className="text-gray-600 text-xs mt-1">{channel.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>{channel.followers_count} followers</span>
                              <span>Rep: {channel.rep_score}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={connectSelectedChannels}
                      disabled={selectedChannels.size === 0}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Connect {selectedChannels.size} Channel{selectedChannels.size !== 1 ? 's' : ''}
                    </button>
                  </div>
                </>
              ) : (
                // No channels found - show empty state
                <>
                  <div className="text-center mb-6">
                    <div className="bg-gray-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Channels Found</h3>
                    <p className="text-gray-600 text-sm mb-4">{statusMessage}</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                      <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Your Privy account is ready to use</li>
                        <li>• You can create new channels anytime</li>
                        <li>• Try a different email if you have channels elsewhere</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={onComplete}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Complete Setup
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStep('email_input');
                        setEmailInput('');
                        setProgress(50);
                      }}
                      className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      Try Different Email
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Connecting Channels Step */}
          {currentStep === 'connecting_channels' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connecting Channels</h3>
              <p className="text-gray-600">{statusMessage}</p>
            </div>
          )}

          {/* Completed Step */}
          {currentStep === 'completed' && (
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Set!</h3>
              <p className="text-gray-600 mb-6">{statusMessage}</p>
              <button
                onClick={onComplete}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Error Step */}
          {currentStep === 'error' && (
            <div className="text-center">
              <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Something Went Wrong</h3>
              <p className="text-red-600 mb-4">{errorMessage}</p>
              <div className="flex gap-3">
                <button
                  onClick={startChannelConnectionFlow}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
