'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { clearUserData } from '@/lib/auth/user-service';
import { createPortal } from 'react-dom';

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
  const [mounted, setMounted] = useState(false);

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);
  

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
      console.log('🚀 Starting channel connection flow for user:', user?.id);
      setCurrentStep('creating_user');
      setProgress(10);
      setStatusMessage('Setting up your account...');
      setErrorMessage('');

      // Step 1: Create/Update Privy user
      console.log('📝 Creating user with Privy data:', { id: user?.id, email: user?.email?.address });
      const userResponse = await fetch('/api/v1/user_new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privy_data: user })
      });
      console.log('📝 User creation response status:', userResponse.status);

      if (!userResponse.ok) {
        throw new Error('Failed to create user account');
      }

      const userData = await userResponse.json();
      console.log('🔍 User creation response:', userData);
      console.log('🔍 Response structure check:', {
        hasUser: !!userData.user,
        hasDirectId: !!userData.id,
        userKeys: userData.user ? Object.keys(userData.user) : 'no user object',
        topLevelKeys: Object.keys(userData),
        userIdValue: userData.user?.id,
        directIdValue: userData.id
      });
      
      const extractedUserId = userData.user?.id || userData.id;
      console.log('🔍 Extracted userId:', extractedUserId);
      
      if (!extractedUserId) {
        console.error('❌ Failed to extract user ID. Full response:', userData);
        throw new Error(`Failed to get user ID from response. Expected userData.user.id but got: ${JSON.stringify(userData)}`);
      }
      
      setUserId(extractedUserId);
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
        console.log('🔍 Backend returned channels:', channelData);
        
        if (channelData.channels && channelData.channels.length > 0) {
          // Categorize channels by ownership type
          const privyOwnedChannels = channelData.channels.filter((channel: Channel) => 
            channel.ownership?.privy_id === user?.id
          );
          
          const clerkAvailableChannels = channelData.channels.filter((channel: Channel) => 
            channel.ownership?.auth_type === 'clerk' && !channel.ownership?.privy_id
          );
          
          const occupiedChannels = channelData.channels.filter((channel: Channel) => 
            channel.ownership?.privy_id && channel.ownership.privy_id !== user?.id
          );

          console.log('📊 Channel categorization:', {
            privyOwned: privyOwnedChannels.length,
            clerkAvailable: clerkAvailableChannels.length, 
            occupied: occupiedChannels.length,
            total: channelData.channels.length
          });

          if (privyOwnedChannels.length > 0) {
            // Priority 1: Auto-connect channels already owned by this Privy user
            console.log(`🔗 Auto-connecting ${privyOwnedChannels.length} channels already owned by this Privy ID`);
            setChannels(privyOwnedChannels);
            setSelectedChannels(new Set(privyOwnedChannels.map((c: Channel) => c.id)));
            setStatusMessage(`Auto-connecting ${privyOwnedChannels.length} channels...`);
            setProgress(90);
            
            // Automatically connect these channels (skips connecting modal)
            await connectChannelsWithPrivyId(privyOwnedChannels, extractedUserId);
            return;
          } else if (clerkAvailableChannels.length > 0 || occupiedChannels.length > 0) {
            // Priority 2: Show all channels for manual selection (available + occupied)
            setChannels(channelData.channels);
            setCurrentStep('showing_channels');
            setStatusMessage(`Found ${channelData.channels.length} channels - ${clerkAvailableChannels.length} available, ${occupiedChannels.length} occupied`);
            setProgress(85);
            
            // Auto-select only available channels (Clerk channels without Privy ID)
            setSelectedChannels(new Set(clerkAvailableChannels.map((c: Channel) => c.id)));
            return;
          }
        }
      }

      // Step 3: No channels found - show empty state with option to search by different email
      console.log('📭 No channels found with current criteria');
      setChannels([]);
      setCurrentStep('showing_channels');
      if (!user?.email?.address) {
        setStatusMessage('No existing channels found for your account');
      } else {
        setStatusMessage(`No existing channels found for ${user.email.address}`);
      }
      setProgress(100);
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
            // Found channels already connected to this Privy ID - auto-connect them
            console.log(`🔗 Auto-connecting ${privyConnectedChannels.length} channels from email search`);
            setChannels(privyConnectedChannels);
            setSelectedChannels(new Set(privyConnectedChannels.map((c: Channel) => c.id)));
            setStatusMessage(`Auto-connecting ${privyConnectedChannels.length} channels...`);
            setProgress(90);
            
            // Automatically connect these channels (skips connecting modal)
            await connectChannelsWithPrivyId(privyConnectedChannels, userId);
            return;
          } else {
            // Found channels by email but not connected to this Privy ID
            setCurrentStep('showing_channels');
            setStatusMessage(`Found ${channelData.channels.length} channels for ${email}`);
            // Auto-select only available channels (not occupied by other Privy users)
            const availableChannels = channelData.channels.filter((c: Channel) => 
              !(c.ownership?.privy_id && c.ownership.privy_id !== user?.id)
            );
            setSelectedChannels(new Set(availableChannels.map((c: Channel) => c.id)));
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

  // Auto-connect channels that already have the same Privy ID
  const connectChannelsWithPrivyId = async (channels: Channel[], userIdParam: string) => {
    try {
      console.log('🔗 Auto-connecting channels with matching Privy ID:', channels.map(c => c.name));
      
      for (const channel of channels) {
        console.log(`🔗 Connecting channel: ${channel.name} (${channel.id})`);
        
        // Since the channel already has this Privy ID, we can connect directly
        await fetch(`/api/v1/user_new/${userIdParam}/connect-channel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel_id: channel.id })
        });
      }

      // After auto-connections, fetch updated channel info
      console.log('🔄 Fetching updated channel information after auto-connections...');
      try {
        const searchCriteria: any = {};
        if (user?.id) {
          searchCriteria.privy_id = user.id;
        }
        if (user?.email?.address) {
          searchCriteria.email = user.email.address;
        }

        const updatedChannelResponse = await fetch('/api/v1/user_new/search-channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchCriteria)
        });

        if (updatedChannelResponse.ok) {
          const updatedChannelData = await updatedChannelResponse.json();
          console.log('📊 Updated channel data after auto-connections:', updatedChannelData);
          
          // Store the updated channel information
          setChannels(updatedChannelData.channels || []);
          
          // Store in localStorage for persistence
          if (updatedChannelData.channels) {
            localStorage.setItem('connected_channels', JSON.stringify(updatedChannelData.channels));
            localStorage.setItem('channel_connection_timestamp', new Date().toISOString());
          }
        }
      } catch (error) {
        console.error('Failed to fetch updated channel info after auto-connection:', error);
      }

      // Skip the connecting modal and go directly to completed
      setCurrentStep('completed');
      setStatusMessage(`Successfully auto-connected ${channels.length} channels!`);
      setProgress(100);
      
      console.log('✅ Auto-connection completed successfully');
    } catch (error) {
      console.error('Auto-connection failed:', error);
      setCurrentStep('error');
      setErrorMessage('Failed to auto-connect channels. Please try again.');
    }
  };

  const handleChannelSelection = (channelId: string) => {
    // Check if this channel is occupied by a different Privy user
    const channel = channels.find(c => c.id === channelId);
    if (channel?.ownership?.privy_id && channel.ownership.privy_id !== user?.id) {
      // Channel is occupied by different Privy user - not selectable
      return;
    }
    
    const newSelection = new Set(selectedChannels);
    if (newSelection.has(channelId)) {
      newSelection.delete(channelId);
    } else {
      newSelection.add(channelId);
    }
    setSelectedChannels(newSelection);
  };

  // Helper function to determine if a channel is selectable
  const isChannelSelectable = (channel: Channel) => {
    // Not selectable if it's owned by a different Privy user
    return !(channel.ownership?.privy_id && channel.ownership.privy_id !== user?.id);
  };

  // Helper function to get channel status
  const getChannelStatus = (channel: Channel) => {
    if (channel.ownership?.privy_id) {
      if (channel.ownership.privy_id === user?.id) {
        return 'owned_by_you';
      } else {
        return 'occupied';
      }
    }
    return 'available';
  };

  // Helper function to check if all channels are occupied (not selectable)
  const areAllChannelsOccupied = () => {
    if (channels.length === 0) return false;
    return channels.every(channel => !isChannelSelectable(channel));
  };

  // Clear all cached data and auth info (similar to LoginButton)
  const clearAllData = async () => {
    try {
      console.log('🧹 Clearing all auth and channel data...');
      
      // Use shared utility to clear localStorage
      clearUserData();
      
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
        console.log('🔍 Connecting channel:', channel.id, 'with userId:', userId);
        
        try {
          // Try to connect the channel directly
          const connectResponse = await fetch(`/api/v1/user_new/${userId}/connect-channel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel_id: channel.id })
          });
          
          if (connectResponse.ok) {
            const connectResult = await connectResponse.json();
            console.log('✅ Successfully connected channel:', channel.name, connectResult);
          } else {
            const errorText = await connectResponse.text();
            console.error('❌ Failed to connect channel:', channel.name, errorText);
          }
        } catch (error) {
          console.error('❌ Connection error for channel:', channel.name, error);
        }
      }

      // After all connections, fetch updated channel info to store the latest ownership data
      console.log('🔄 Fetching updated channel information after connections...');
      try {
        const searchCriteria: any = {};
        if (user?.id) {
          searchCriteria.privy_id = user.id;
        }
        if (user?.email?.address) {
          searchCriteria.email = user.email.address;
        }

        const updatedChannelResponse = await fetch('/api/v1/user_new/search-channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchCriteria)
        });

        if (updatedChannelResponse.ok) {
          const updatedChannelData = await updatedChannelResponse.json();
          console.log('📊 Updated channel data after connections:', updatedChannelData);
          
          // Store the updated channel information
          setChannels(updatedChannelData.channels || []);
          
          // Store in localStorage for persistence
          if (updatedChannelData.channels) {
            localStorage.setItem('connected_channels', JSON.stringify(updatedChannelData.channels));
            localStorage.setItem('channel_connection_timestamp', new Date().toISOString());
          }
        }
      } catch (error) {
        console.error('Failed to fetch updated channel info:', error);
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



  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
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
                    <div className={`rounded-full p-3 w-12 h-12 mx-auto mb-3 ${
                      areAllChannelsOccupied() 
                        ? 'bg-orange-100' 
                        : 'bg-green-100'
                    }`}>
                      {areAllChannelsOccupied() ? (
                        <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {areAllChannelsOccupied() ? 'All Channels Occupied' : 'Connect Your Channels'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {areAllChannelsOccupied() 
                        ? 'All found channels are already owned by other accounts. Try a different email or complete setup without channels.'
                        : statusMessage
                      }
                    </p>
                  </div>

                  {areAllChannelsOccupied() && (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-sm font-medium text-orange-800">
                          All {channels.length} channels are owned by other accounts
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {channels.map((channel) => {
                      const channelStatus = getChannelStatus(channel);
                      const isSelectable = isChannelSelectable(channel);
                      
                      return (
                        <div 
                          key={channel.id}
                          className={`border rounded-lg p-3 transition-all ${
                            !isSelectable
                              ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-75'
                              : selectedChannels.has(channel.id) 
                                ? 'border-blue-500 bg-blue-50 cursor-pointer' 
                                : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                          }`}
                          onClick={() => isSelectable && handleChannelSelection(channel.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedChannels.has(channel.id)}
                                  onChange={() => isSelectable && handleChannelSelection(channel.id)}
                                  disabled={!isSelectable}
                                  className={`mr-3 ${isSelectable ? 'text-blue-500' : 'text-gray-400 cursor-not-allowed'}`}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className={`font-semibold ${isSelectable ? 'text-gray-900' : 'text-gray-500'}`}>
                                        {channel.name}
                                      </h4>
                                      <p className={`text-sm ${isSelectable ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {channel.channel_handle}
                                      </p>
                                    </div>
                                    {channelStatus === 'occupied' && (
                                      <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        Occupied
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className={`text-xs mt-1 ${isSelectable ? 'text-gray-600' : 'text-gray-400'}`}>
                                {channel.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>{channel.followers_count} followers</span>
                                <span>Rep: {channel.rep_score}</span>
                                {channelStatus === 'occupied' && channel.ownership?.user_name && (
                                  <span className="text-red-600 font-medium">
                                    Owned by: {channel.ownership.user_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 mt-6">
                    {areAllChannelsOccupied() ? (
                      // All channels are occupied - show retry search button
                      <>
                        <button
                          onClick={onComplete}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Complete Setup
                        </button>
                        <button
                          onClick={() => {
                            setCurrentStep('email_input');
                            setProgress(50);
                            setStatusMessage('Try a different email to find more channels');
                            setEmailInput('');
                          }}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Try Different Email
                        </button>
                      </>
                    ) : (
                      // Some channels are selectable - show connect button
                      <button
                        onClick={connectSelectedChannels}
                        disabled={selectedChannels.size === 0}
                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Connect {selectedChannels.size} Channel{selectedChannels.size !== 1 ? 's' : ''}
                      </button>
                    )}
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

  return createPortal(modalContent, document.body);
}
