'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

export default function AuthDebugInfo() {
  const { authenticated, user, ready, getAccessToken } = usePrivy();
  const [mounted, setMounted] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

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
      </div>
      
      {/* Raw user object (collapsed) */}
      <details className="mt-2">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          Raw User Object
        </summary>
        <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32 text-black">
          {JSON.stringify(user, null, 2)}
        </pre>
      </details>
    </div>
  );
}
