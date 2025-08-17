// src/components/PaymentInterface.tsx
'use client';

import { useState, useEffect } from 'react';
import { useX402Client } from '../lib/x402-client';
import { usePrivy } from '@privy-io/react-auth';
// Note: useFacilitator from x402/verify is only available in Coinbase workspace
// Using direct API approach until packages are publicly released

interface PaymentResult {
  data: unknown;
  paymentResponse?: unknown;
  status: number;
  cost?: string;
}



export default function PaymentInterface() {
  // Privy integration
  const { authenticated, login, logout } = usePrivy();
  
  // x402 client with Privy wallet integration
  const { 
    client, 
    makePaymentRequest, 
    isLoading: clientLoading, 
    error: clientError, 
    isReady, 
    walletAddress,
  } = useX402Client();
  
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, PaymentResult>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});


  const makeRequest = async (endpoint: string, method: string = 'GET', data?: unknown) => {
    // Check if wallet is connected and client is ready
    if (!authenticated) {
      setErrors(prev => ({ ...prev, [`${method}-${endpoint}`]: 'Please connect your wallet first to make payments.' }));
      return;
    }

    if (!isReady || !client) {
      setErrors(prev => ({ ...prev, [`${method}-${endpoint}`]: 'Wallet not ready. Please ensure your wallet is connected and try again.' }));
      return;
    }

    const key = `${method}-${endpoint}`;
    setLoading(key);
    
    // Clear previous results and errors for this key
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
    
    setResults(prev => {
      const newResults = { ...prev };
      delete newResults[key];
      return newResults;
    });

    try {
      const result = await makePaymentRequest(endpoint, {
        method,
        data
      });

      setResults(prev => ({ 
        ...prev, 
        [key]: {
          ...result,
          cost: getCostForEndpoint(endpoint)
        }
      }));

    } catch (error: unknown) {
      // Don't show 402 errors as they are part of the normal x402 payment flow
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status !== 402) {
          const errorMessage = axiosError.response?.data?.error || 'Unknown error occurred';
          setErrors(prev => ({ ...prev, [key]: errorMessage }));
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setErrors(prev => ({ ...prev, [key]: errorMessage }));
      }
    } finally {
      setLoading(null);
    }
  };

  const getCostForEndpoint = (endpoint: string): string => {
    const costs: Record<string, string> = {
      '/api/premium': '$0.01',
      '/api/analytics': '$0.05',
      '/api/ai-insights': '$0.10'
    };
    return costs[endpoint] || 'Unknown';
  };

  const isLoading = (key: string) => loading === key;



  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          x402 Payment Demo
        </h1>
        <p className="text-gray-600">
          Connect your wallet and access premium APIs with instant USDC payments
        </p>
        
        {/* Wallet Connection Status */}
        <div className="mt-4 p-4 rounded-lg">
          {!authenticated ? (
            <div className="bg-yellow-50 border border-yellow-200">
              <div className="flex items-center justify-center space-x-4">
                <p className="text-sm text-yellow-700">
                  Connect your wallet to start making payments
                </p>
                <button
                  onClick={login}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          ) : !isReady ? (
            <div className="bg-orange-50 border border-orange-200">
              <div className="flex items-center justify-center space-x-4">
                <p className="text-sm text-orange-700">
                  Wallet connected, initializing payments...
                </p>
                {clientLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-700">
                  <strong>Wallet Connected:</strong> {walletAddress}
                  <br />
                  <strong>Payment Status:</strong> Ready for x402 payments
                </p>
                <button
                  onClick={logout}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
          
          {clientError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              Client Error: {clientError}
            </div>
          )}
        </div>
      </div>



      {/* API Endpoints */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Premium API */}
        <div className="border rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Premium Content</h3>
            <p className="text-sm text-gray-600">Exclusive market data and insights</p>
            <p className="text-lg font-bold text-green-600">$0.01 USDC</p>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => makeRequest('/api/premium', 'GET')}
              disabled={!authenticated || !isReady || isLoading('GET-/api/premium')}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              {isLoading('GET-/api/premium') ? 'Processing...' : 'Get Premium Data'}
            </button>
            
            <button
              onClick={() => makeRequest('/api/premium', 'POST', { query: 'market analysis' })}
              disabled={!authenticated || !isReady || isLoading('POST-/api/premium')}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              {isLoading('POST-/api/premium') ? 'Processing...' : 'Submit Premium Query'}
            </button>
          </div>
        </div>

        {/* Analytics API */}
        <div className="border rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Analytics</h3>
            <p className="text-sm text-gray-600">Advanced metrics and KPIs</p>
            <p className="text-lg font-bold text-green-600">$0.05 USDC</p>
          </div>
          
          <button
            onClick={() => makeRequest('/api/analytics', 'GET')}
            disabled={!authenticated || !isReady || isLoading('GET-/api/analytics')}
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {isLoading('GET-/api/analytics') ? 'Processing...' : 'Get Analytics'}
          </button>
        </div>

        {/* AI Insights API */}
        <div className="border rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">AI Insights</h3>
            <p className="text-sm text-gray-600">AI-powered predictions</p>
            <p className="text-lg font-bold text-green-600">$0.10 USDC</p>
          </div>
          
          <button
            onClick={() => makeRequest('/api/ai-insights', 'GET')}
            disabled={!authenticated || !isReady || isLoading('GET-/api/ai-insights')}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {isLoading('GET-/api/ai-insights') ? 'Processing...' : 'Get AI Insights'}
          </button>
        </div>
      </div>

      {/* Results Display */}
      <div className="space-y-6">
        {Object.entries(results).map(([key, result]) => (
          <div key={key} className="border rounded-lg p-6 bg-green-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-800">
                ✅ Success: {key}
              </h3>
              <span className="text-sm font-medium text-green-600">
                Cost: {result.cost}
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-700">Response Data:</h4>
                <pre className="mt-1 p-3 bg-white rounded border text-sm overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
              
              {result.paymentResponse ? (
                <div>
                  <h4 className="font-medium text-gray-700">Payment Details:</h4>
                  <pre className="mt-1 p-3 bg-white rounded border text-sm overflow-auto">
                    {JSON.stringify(result.paymentResponse, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {Object.entries(errors)
          .filter(([, error]) => error && error.trim() !== '')
          .map(([key, error]) => (
            <div key={key} className="border border-red-200 rounded-lg p-6 bg-red-50">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                ❌ Error: {key}
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
          ))}
      </div>

      {/* How it Works */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">How x402 Works</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Payment Flow</h3>
            <ol className="space-y-2 text-sm">
              <li>1. Client requests premium endpoint</li>
              <li>2. Server responds with HTTP 402 Payment Required</li>
              <li>3. x402-axios automatically handles payment challenge</li>
              <li>4. User wallet signs payment authorization</li>
              <li>5. Request retried with X-PAYMENT header</li>
              <li>6. Server verifies payment and returns content</li>
              <li>7. Payment settled on blockchain (Base)</li>
            </ol>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Technical Stack</h3>
            <ul className="space-y-2 text-sm">
              <li><strong>Frontend:</strong> x402-axios for automatic payment handling</li>
              <li><strong>Backend:</strong> x402-next middleware for payment verification</li>
              <li><strong>Blockchain:</strong> Base (L2) for fast, cheap settlements</li>
              <li><strong>Currency:</strong> USDC stablecoin payments</li>
              <li><strong>Facilitator:</strong> Coinbase x402 service</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
