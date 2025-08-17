// src/components/WalletConnection.tsx
'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useViemWalletClient } from '@/lib/privy-wallet';
import { useX402Client } from '@/lib/x402-client';
import { useState } from 'react';

interface WalletConnectionProps {
  showDetails?: boolean;
  className?: string;
}

export default function WalletConnection({ 
  showDetails = true, 
  className = "" 
}: WalletConnectionProps) {
  const { authenticated, login, logout, user } = usePrivy();
  const { isReady, getAddress, getChainId, switchChain } = useViemWalletClient();
  const { client, isLoading: clientLoading, error: clientError } = useX402Client();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await login();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const handleSwitchToBaseSepolia = async () => {
    const targetChainId = 84532; // Base Sepolia
    try {
      await switchChain(targetChainId);
    } catch (error) {
      console.error('Failed to switch chain:', error);
    }
  };

  const walletAddress = getAddress();
  const currentChainId = getChainId();
  const isOnBaseSepolia = currentChainId === 84532;

  if (!authenticated) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Wallet Required
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Connect your wallet to access x402 payment features
              </p>
            </div>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main wallet status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-green-800">
              Wallet Connected
            </h3>
            {showDetails && (
              <div className="text-sm text-green-700 mt-1 space-y-1">
                <p className="truncate">
                  <strong>Address:</strong> {walletAddress}
                </p>
                <p>
                  <strong>Chain:</strong> {isOnBaseSepolia ? 'Base Sepolia' : `Chain ${currentChainId}`}
                </p>
                {user?.email && (
                  <p>
                    <strong>Email:</strong> {user.email.address}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {!isOnBaseSepolia && (
              <button
                onClick={handleSwitchToBaseSepolia}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
              >
                Switch to Base
              </button>
            )}
            <button
              onClick={handleDisconnect}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* x402 client status */}
      {showDetails && (
        <div className={`border rounded-lg p-3 ${
          isReady && client ? 'bg-green-50 border-green-200' : 
          clientLoading ? 'bg-orange-50 border-orange-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`text-sm font-medium ${
                isReady && client ? 'text-green-800' : 
                clientLoading ? 'text-orange-800' :
                'text-red-800'
              }`}>
                x402 Payment Status
              </h4>
              <p className={`text-sm mt-1 ${
                isReady && client ? 'text-green-700' : 
                clientLoading ? 'text-orange-700' :
                'text-red-700'
              }`}>
                {clientLoading ? 'Initializing payment client...' :
                 isReady && client ? 'Ready for payments' :
                 clientError ? `Error: ${clientError}` :
                 'Payment client not ready'}
              </p>
            </div>
            {clientLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
            )}
          </div>
        </div>
      )}

      {/* Chain warning */}
      {!isOnBaseSepolia && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-orange-800">
                Wrong Network
              </h4>
              <p className="text-sm text-orange-700 mt-1">
                Switch to Base Sepolia for x402 payments
              </p>
            </div>
            <button
              onClick={handleSwitchToBaseSepolia}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
            >
              Switch Network
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for headers/nav
export function WalletConnectionCompact({ className = "" }: { className?: string }) {
  const { authenticated, login, logout } = usePrivy();
  const { getAddress } = useViemWalletClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await login();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!authenticated) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded transition-colors ${className}`}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  const address = getAddress();
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <span className="text-sm text-gray-600">
        {shortAddress}
      </span>
      <button
        onClick={logout}
        className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
