'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

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
    is_clerk_user: boolean;
    is_privy_user: boolean;
  };
}

interface ChannelSearchResponse {
  email: string;
  channels: Channel[];
  total: number;
  message: string;
}

export default function AuthDebugInfo() {
  const { authenticated, user, ready, getAccessToken } = usePrivy();
  const [mounted, setMounted] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<string>('');
  const [storedChannels, setStoredChannels] = useState<Channel[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update token info when authentication changes
  useEffect(() => {
    if (authenticated && mounted) {
      getAccessToken()
        .then(token => {
          if (token) {
            // Show first and last 10 characters of token
            const tokenPreview = `${token.slice(0, 10)}...${token.slice(-10)}`;
            setTokenInfo(tokenPreview);
          }
        })
        .catch(() => setTokenInfo('Error getting token'));
    } else {
      setTokenInfo('');
    }
  }, [authenticated, mounted, getAccessToken]);

  // Read stored channel data from localStorage
  useEffect(() => {
    if (mounted) {
      const updateStoredChannels = () => {
        try {
          const channelsData = localStorage.getItem('connected_channels');
          if (channelsData) {
            const parsedChannels = JSON.parse(channelsData);
            setStoredChannels(Array.isArray(parsedChannels) ? parsedChannels : []);
          } else {
            setStoredChannels([]);
          }
        } catch (error) {
          console.error('Error reading stored channels:', error);
          setStoredChannels([]);
        }
      };

      // Initial read
      updateStoredChannels();

      // Listen for localStorage changes
      const handleStorageChange = () => updateStoredChannels();
      window.addEventListener('storage', handleStorageChange);
      
      // Also check periodically for changes (in case same-tab updates)
      const interval = setInterval(updateStoredChannels, 1000);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-4 text-xs font-mono">
      <div className="font-bold text-gray-700 mb-2">🔍 Auth Debug Info</div>
      
      <div className="grid grid-cols-2 gap-2 text-gray-600">
        <div>
          <span className="font-semibold">Ready:</span> 
          <span className={ready ? 'text-green-600' : 'text-red-600'}>
            {ready ? '✓' : '✗'}
          </span>
        </div>
        
        <div>
          <span className="font-semibold">Authenticated:</span> 
          <span className={authenticated ? 'text-green-600' : 'text-red-600'}>
            {authenticated ? '✓' : '✗'}
          </span>
        </div>
        
        <div>
          <span className="font-semibold">User ID:</span> 
          <span className="text-blue-600">
            {user?.id ? `${user.id.slice(0, 8)}...` : 'None'}
          </span>
        </div>
        
        <div>
          <span className="font-semibold">Email:</span> 
          <span className="text-purple-600">
            {user?.email?.address || 'None'}
          </span>
        </div>
        
        <div className="col-span-2">
          <span className="font-semibold">Wallets:</span> 
          <span className="text-indigo-600">
            {user?.wallet ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : 'None'}
          </span>
        </div>
        
        <div className="col-span-2">
          <span className="font-semibold">Token:</span> 
          <span className="text-orange-600 break-all">
            {tokenInfo || 'None'}
          </span>
        </div>
        
        <div className="col-span-2">
          <span className="font-semibold">Login Methods:</span> 
          <span className="text-teal-600">
            {user?.linkedAccounts?.map(account => account.type).join(', ') || 'None'}
          </span>
        </div>
        
        <div className="col-span-2">
          <span className="font-semibold">Local Storage Keys:</span> 
          <span className="text-gray-500">
            {typeof window !== 'undefined' 
              ? Object.keys(localStorage).filter(key => key.includes('privy')).length 
              : 0} privy keys
          </span>
        </div>

        <div className="col-span-2">
          <span className="font-semibold">Stored Channels:</span> 
          <span className="text-purple-600">
            {storedChannels.length} channels in localStorage
          </span>
        </div>

        <div className="col-span-2">
          <span className="font-semibold">Last Connection:</span> 
          <span className="text-gray-600">
            {typeof window !== 'undefined' && localStorage.getItem('channel_connection_timestamp')
              ? new Date(localStorage.getItem('channel_connection_timestamp') || '').toLocaleString()
              : 'Never'
            }
          </span>
        </div>
      </div>

      {/* Channel List */}
      {storedChannels.length > 0 && (
        <div className="mt-3 border-t pt-2">
          <div className="font-semibold text-gray-700 mb-2">📺 Connected Channels (from localStorage):</div>
          {storedChannels.map((channel, index) => (
            <div key={channel.id} className="bg-white p-2 rounded border mb-2 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-gray-800">{channel.name}</div>
                  <div className="text-blue-600">{channel.channel_handle}</div>
                  <div className="text-gray-600 mt-1">{channel.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-green-600">{channel.followers_count} followers</div>
                  <div className="text-purple-600">Rep: {channel.rep_score}</div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t text-gray-500">
                <div>Owner: {channel.ownership.user_name} ({channel.ownership.user_email})</div>
                <div>Auth: {channel.ownership.auth_type} | 
                  Clerk: {channel.ownership.is_clerk_user ? '✓' : '✗'} | 
                  Privy: {channel.ownership.is_privy_user ? '✓' : '✗'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Raw user object (collapsed) */}
      <details className="mt-2">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          Raw Privy User Object
        </summary>
        <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32 text-black">
          {JSON.stringify(user, null, 2)}
        </pre>
      </details>

      {/* Raw localStorage data (collapsed) */}
      <details className="mt-2">
        <summary className="cursor-pointer text-purple-500 hover:text-purple-700">
          Raw localStorage Data
        </summary>
        <pre className="mt-1 text-xs bg-purple-50 p-2 rounded border overflow-auto max-h-32 text-black">
          {JSON.stringify({
            connected_channels: storedChannels,
            channel_connection_timestamp: typeof window !== 'undefined' ? localStorage.getItem('channel_connection_timestamp') : null,
            privy_keys: typeof window !== 'undefined' ? Object.keys(localStorage).filter(key => key.includes('privy')) : []
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
