// src/lib/x402-client.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallets } from '@privy-io/react-auth';
import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { createWalletClient, custom } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import type { WalletClient } from 'viem';

// Dynamically import x402 to avoid SSR issues
let withPaymentInterceptor: any;
let decodeXPaymentResponse: any;

const initX402 = async () => {
  if (typeof window !== 'undefined' && !withPaymentInterceptor) {
    const x402Module = await import('x402-axios');
    withPaymentInterceptor = x402Module.withPaymentInterceptor;
    decodeXPaymentResponse = x402Module.decodeXPaymentResponse;
  }
};

interface PaymentResponse {
  data: unknown;
  paymentResponse?: unknown;
  status: number;
  headers: Record<string, unknown>;
}

interface RequestOptions extends AxiosRequestConfig {
  method?: string;
  data?: unknown;
  params?: unknown;
}

/**
 * Creates a proper Viem WalletClient from a Privy wallet
 * Following the standard Privy → Viem → x402-axios pattern
 */
async function createViemWalletClient(wallet: any, testnet: boolean = true): Promise<WalletClient> {
  console.log('=== CREATING VIEM WALLET CLIENT ===');
  
  // 1) Ensure correct chain *before* creating the client
  const chain = testnet ? baseSepolia : base;
  console.log(`Switching to chain: ${chain.name} (${chain.id})`);
  
  try {
    await wallet.switchChain(chain.id);
    console.log('✅ Chain switch successful');
  } catch (error) {
    console.warn('⚠️ Chain switch failed, continuing with current chain:', error);
  }

  // 2) Get EIP-1193 provider from Privy
  console.log('Getting EIP-1193 provider from Privy...');
  const provider = await wallet.getEthereumProvider();
  
  if (!provider) {
    throw new Error('Failed to get EIP-1193 provider from Privy wallet');
  }
  
  console.log('✅ EIP-1193 provider obtained');

  // 3) Build a Viem Wallet Client with the provider + the wallet address
  console.log('Creating Viem WalletClient with:', {
    account: wallet.address,
    chain: chain.name,
    chainId: chain.id
  });
  
  const walletClient = createWalletClient({
    account: wallet.address as `0x${string}`,
    chain,
    transport: custom(provider),
  });

  console.log('✅ Viem WalletClient created successfully');
  return walletClient;
}

export function useX402Client() {
  const { wallets } = useWallets();
  const [client, setClient] = useState<AxiosInstance | null>(null);
  const [lastWalletAddress, setLastWalletAddress] = useState<string | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  // Create or recreate the client when wallet changes
  const createClient = useCallback(async () => {
    console.log('=== WALLET SELECTION ===');
    console.log('Available wallets:', wallets.map(w => ({
      address: w.address,
      type: w.walletClientType,
      chainId: w.chainId
    })));
    
    // First try to find an external wallet, then fall back to embedded wallet
    let wallet = wallets.find((w) => w.walletClientType !== 'privy');
    if (!wallet) {
      console.log('No external wallet found, trying embedded wallet...');
      wallet = wallets.find((w) => w.walletClientType === 'privy');
    }
    
    console.log('Selected wallet:', wallet ? {
      address: wallet.address,
      type: wallet.walletClientType,
      chainId: wallet.chainId
    } : 'none');
    
    if (!wallet) {
      console.log('No wallet found, clearing client');
      setClient(null);
      setLastWalletAddress(null);
      return null;
    }

    // Don't recreate if the same wallet is already in use
    if (wallet.address === lastWalletAddress && client) {
      console.log('Same wallet already in use, returning existing client');
      return client;
    }

    if (isCreatingClient) {
      console.log('Client creation already in progress, skipping');
      return client;
    }

    setIsCreatingClient(true);
    console.log('=== CREATING X402 CLIENT ===');
    console.log('Wallet details:', {
      address: wallet.address,
      type: wallet.walletClientType,
      chainId: wallet.chainId
    });

    try {
      // Initialize x402 imports
      await initX402();
      
      if (!withPaymentInterceptor) {
        throw new Error('Failed to load x402-axios module');
      }

      // Create base axios client
      const baseAxiosClient = axios.create({
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Base axios client created');

      // Create Viem wallet client using proper Privy integration
      const viemWalletClient = await createViemWalletClient(wallet, true); // Use testnet for now
      
      console.log('Viem client validation:', {
        hasAccount: !!viemWalletClient.account,
        accountAddress: viemWalletClient.account?.address,
        hasChain: !!viemWalletClient.chain,
        chainId: viemWalletClient.chain?.id,
        hasTransport: !!viemWalletClient.transport
      });

      // Apply x402 payment interceptor
      console.log('Applying withPaymentInterceptor...');
      console.log('Base client before interceptor:', {
        type: typeof baseAxiosClient,
        constructor: baseAxiosClient.constructor?.name,
        hasRequest: typeof baseAxiosClient.request,
        hasGet: typeof baseAxiosClient.get,
        hasPost: typeof baseAxiosClient.post
      });
      
      const axiosClient = withPaymentInterceptor(baseAxiosClient, viemWalletClient);

      console.log('X402 client validation after interceptor:', {
        type: typeof axiosClient,
        constructor: axiosClient?.constructor?.name,
        hasRequest: typeof axiosClient?.request,
        hasGet: typeof axiosClient?.get,
        hasPost: typeof axiosClient?.post,
        hasInterceptors: !!axiosClient?.interceptors,
        isAxiosInstance: axiosClient?.constructor?.name === 'Axios',
        isNull: axiosClient === null,
        isUndefined: axiosClient === undefined,
        keys: axiosClient ? Object.keys(axiosClient).slice(0, 10) : [],
        isSameAsBase: axiosClient === baseAxiosClient
      });

      if (!axiosClient) {
        console.error('❌ withPaymentInterceptor returned null/undefined');
        throw new Error('withPaymentInterceptor returned null client');
      }
      
      if (typeof axiosClient.request !== 'function' && typeof axiosClient.get !== 'function') {
        console.error('❌ withPaymentInterceptor returned client without HTTP methods');
        console.error('Client details:', {
          prototype: Object.getPrototypeOf(axiosClient)?.constructor?.name,
          ownKeys: Object.getOwnPropertyNames(axiosClient).slice(0, 15),
          descriptors: Object.getOwnPropertyDescriptors(axiosClient)
        });
        
        // If the interceptor broke the client, fall back to base client
        console.warn('🔄 Falling back to base client due to interceptor failure');
        setClient(baseAxiosClient);
        setLastWalletAddress(wallet.address);
        return baseAxiosClient;
      }

      // Add response interceptor to handle payment responses
      axiosClient.interceptors.response.use(
        (response: AxiosResponse) => {
          // Decode payment response if present
          const paymentResponseHeader = response.headers['x-payment-response'];
          if (paymentResponseHeader && decodeXPaymentResponse) {
            try {
              const paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
              (response as AxiosResponse & { paymentResponse?: unknown }).paymentResponse = paymentResponse;
              console.log('💰 Payment response decoded:', paymentResponse);
            } catch (decodeError) {
              console.warn('Failed to decode payment response:', decodeError);
            }
          }
          return response;
        },
        async (error) => {
          console.log('Response interceptor caught error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            headers: error.response?.headers
          });
          
          // Let x402-axios handle 402 responses automatically
          throw error;
        }
      );

      console.log('✅ X402 client created successfully with payment interceptor');
      setClient(axiosClient);
      setLastWalletAddress(wallet.address);
      return axiosClient;

    } catch (error) {
      console.error('❌ Failed to create X402 client:', error);
      
      // Fallback to base client for non-payment requests
      const fallbackClient = axios.create({
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.warn('🔄 Using fallback client (payments will not work)');
      setClient(fallbackClient);
      setLastWalletAddress(wallet.address);
      return fallbackClient;
    } finally {
      setIsCreatingClient(false);
    }
  }, [wallets, lastWalletAddress, client, isCreatingClient]);

  // Auto-create client when wallets change
  useEffect(() => {
    createClient();
  }, [createClient]);

  const makePaymentRequest = useCallback(async (
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<PaymentResponse> => {
    console.log(`🚀 Making X402 payment request to: ${endpoint}`);
    
    const currentClient = client || await createClient();
    
    if (!currentClient) {
      throw new Error('No wallet connected or client creation failed');
    }

    // Debug the client before making the request
    console.log('=== CLIENT VALIDATION BEFORE REQUEST ===');
    console.log('currentClient type:', typeof currentClient);
    console.log('currentClient constructor:', currentClient?.constructor?.name);
    console.log('currentClient has request:', typeof currentClient?.request);
    console.log('currentClient has get:', typeof currentClient?.get);
    console.log('currentClient has post:', typeof currentClient?.post);
    console.log('currentClient keys:', currentClient ? Object.keys(currentClient).slice(0, 10) : []);
    console.log('currentClient === client:', currentClient === client);
    
    if (!currentClient) {
      throw new Error('No client available');
    }
    
    if (typeof currentClient.request !== 'function') {
      console.error('❌ currentClient.request is not a function!');
      console.error('Available methods:', {
        get: typeof currentClient.get,
        post: typeof currentClient.post,
        put: typeof currentClient.put,
        delete: typeof currentClient.delete,
        patch: typeof currentClient.patch
      });
      
      // Fallback to specific HTTP methods
      const method = (options.method || 'GET').toLowerCase();
      let response;
      
      if (method === 'get' && typeof currentClient.get === 'function') {
        response = await currentClient.get(endpoint, { params: options.params, ...options });
      } else if (method === 'post' && typeof currentClient.post === 'function') {
        response = await currentClient.post(endpoint, options.data, { params: options.params, ...options });
      } else if (method === 'put' && typeof currentClient.put === 'function') {
        response = await currentClient.put(endpoint, options.data, { params: options.params, ...options });
      } else if (method === 'delete' && typeof currentClient.delete === 'function') {
        response = await currentClient.delete(endpoint, { params: options.params, ...options });
      } else if (method === 'patch' && typeof currentClient.patch === 'function') {
        response = await currentClient.patch(endpoint, options.data, { params: options.params, ...options });
      } else {
        throw new Error(`Client does not have a ${method} method or request method available`);
      }
      
      console.log('✅ Fallback method successful:', {
        method,
        status: response.status,
        hasPaymentResponse: !!(response as any).paymentResponse
      });

      return {
        data: response.data,
        paymentResponse: (response as any).paymentResponse,
        status: response.status,
        headers: response.headers
      };
    }

    try {
      const response = await currentClient.request({
        url: endpoint,
        method: options.method || 'GET',
        data: options.data,
        params: options.params,
        ...options
      });

      console.log('✅ Request successful:', {
        status: response.status,
        hasPaymentResponse: !!(response as any).paymentResponse
      });

      return {
        data: response.data,
        paymentResponse: (response as any).paymentResponse,
        status: response.status,
        headers: response.headers
      };

    } catch (error: any) {
      console.log('Request failed:', {
        status: error.response?.status,
        message: error.message
      });

      // Re-throw non-402 errors (402s are handled by x402-axios automatically)
      if (error.response?.status !== 402) {
        throw error;
      }

      // If we get here, x402-axios should have already handled the payment
      // but something went wrong
      throw new Error(`Payment failed: ${error.message}`);
    }
  }, [client, createClient]);

  return {
    client,
    makePaymentRequest,
    isClientReady: !!client && !isCreatingClient,
    createClient
  };
}