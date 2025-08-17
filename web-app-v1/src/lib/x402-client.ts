// src/lib/x402-client.ts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
    try {
      console.log('🔄 Dynamically importing x402-axios...');
      const x402Module = await import('x402-axios');
      console.log('✅ x402-axios imported successfully:', {
        hasWithPaymentInterceptor: typeof x402Module.withPaymentInterceptor,
        hasDecodeXPaymentResponse: typeof x402Module.decodeXPaymentResponse,
        moduleKeys: Object.keys(x402Module)
      });
      
      withPaymentInterceptor = x402Module.withPaymentInterceptor;
      decodeXPaymentResponse = x402Module.decodeXPaymentResponse;
      
      if (typeof withPaymentInterceptor !== 'function') {
        throw new Error('withPaymentInterceptor is not a function after import');
      }
    } catch (error) {
      console.error('❌ Failed to import x402-axios:', error);
      throw error;
    }
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
  const [clientError, setClientError] = useState<string | null>(null);
  
  // Use refs to avoid dependency issues in createClient
  const clientRef = useRef<AxiosInstance | null>(null);
  const isCreatingClientRef = useRef(false);
  
  // Keep refs in sync with state
  useEffect(() => {
    clientRef.current = client;
  }, [client]);
  
  useEffect(() => {
    isCreatingClientRef.current = isCreatingClient;
  }, [isCreatingClient]);

  // Add client validation whenever client state changes
  useEffect(() => {
    if (client) {
      console.log('=== CLIENT STATE CHANGE VALIDATION ===');
      console.log('Client in state changed:', {
        hasGet: typeof client.get,
        hasPost: typeof client.post,
        hasRequest: typeof client.request,
        constructor: client.constructor?.name,
        isAxiosInstance: client.constructor?.name === 'Axios',
        timestamp: new Date().toISOString()
      });
      
      if (typeof client.get !== 'function') {
        console.error('❌ CLIENT STATE CORRUPTED: stored client missing .get() method!');
        console.error('This indicates the client state was corrupted after creation');
      }
    }
  }, [client]);

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
    if (wallet.address === lastWalletAddress && clientRef.current) {
      console.log('Same wallet already in use, returning existing client');
      return clientRef.current;
    }

    if (isCreatingClientRef.current) {
      console.log('Client creation already in progress, skipping');
      return clientRef.current;
    }

    setIsCreatingClient(true);
    const clientCreationId = Math.random().toString(36).substr(2, 9);
    console.log(`=== CREATING X402 CLIENT [${clientCreationId}] ===`);
    console.log('Wallet details:', {
      address: wallet.address,
      type: wallet.walletClientType,
      chainId: wallet.chainId,
      creationId: clientCreationId
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
      console.log('Base client validation:', {
        hasGet: typeof baseAxiosClient.get,
        hasPost: typeof baseAxiosClient.post,
        hasRequest: typeof baseAxiosClient.request,
        constructor: baseAxiosClient.constructor?.name,
        isAxiosInstance: baseAxiosClient.constructor?.name === 'Axios'
      });

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
      
      // Test that the interceptor function is valid
      console.log('withPaymentInterceptor validation:', {
        type: typeof withPaymentInterceptor,
        isFunction: typeof withPaymentInterceptor === 'function'
      });
      
      if (typeof withPaymentInterceptor !== 'function') {
        throw new Error('withPaymentInterceptor is not a function - x402 import failed');
      }
      
      // TEMPORARY: Skip x402 interceptor due to corruption issue
      // TODO: Investigate and fix x402-axios withPaymentInterceptor corruption
      console.log(`[${clientCreationId}] SKIPPING x402 interceptor due to known corruption issue`);
      console.log(`[${clientCreationId}] Using base axios client (no payment functionality)`);
      
      let axiosClient = baseAxiosClient;
      
      // Add a basic payment response handler for compatibility
      axiosClient.interceptors.response.use(
        (response: AxiosResponse) => {
          // Just pass through - no payment handling
          return response;
        },
        (error: any) => {
          // Log 402 responses but don't handle them
          if (error.response?.status === 402) {
            console.log('💰 Received 402 Payment Required but x402 is disabled');
          }
          throw error;
        }
      );
      
      // Optionally try x402 in the future when fixed:
      /*
      try {
        console.log(`[${clientCreationId}] Calling withPaymentInterceptor...`);
        axiosClient = withPaymentInterceptor(baseAxiosClient, viemWalletClient);
        console.log(`[${clientCreationId}] withPaymentInterceptor returned:`, {
          type: typeof axiosClient,
          constructor: axiosClient?.constructor?.name,
          isNull: axiosClient === null,
          isUndefined: axiosClient === undefined,
          isSameAsBase: axiosClient === baseAxiosClient,
          hasKeys: axiosClient ? Object.keys(axiosClient).length > 0 : false
        });
      } catch (interceptorError) {
        console.error('❌ withPaymentInterceptor threw an error:', interceptorError);
        throw new Error(`withPaymentInterceptor failed: ${interceptorError}`);
      }
      */

      // Simple validation since we're using base client
      console.log(`[${clientCreationId}] Base client validation:`, {
        type: typeof axiosClient,
        constructor: axiosClient?.constructor?.name,
        hasGet: typeof axiosClient?.get,
        hasPost: typeof axiosClient?.post,
        hasRequest: typeof axiosClient?.request,
        isAxiosInstance: axiosClient?.constructor?.name === 'Axios'
      });

      if (!axiosClient || typeof axiosClient.get !== 'function') {
        throw new Error('Base axios client is invalid - this should not happen');
      }

      console.log(`✅ [${clientCreationId}] Base axios client created successfully (x402 disabled)`);
      console.log(`📌 [${clientCreationId}] Setting client in state - final validation:`, {
        hasGet: typeof axiosClient.get,
        hasPost: typeof axiosClient.post,
        constructor: axiosClient.constructor?.name
      });
      
      setClient(axiosClient);
      setLastWalletAddress(wallet.address);
      setClientError('x402 payments disabled due to library issue'); // Clear any previous errors
      return axiosClient;

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create X402 client';
      console.error('❌ Failed to create X402 client:', error);
      setClientError(errorMessage);
      
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
  }, [wallets, lastWalletAddress]); // Remove client and isCreatingClient to prevent infinite loops

  // Auto-create client when wallets change
  useEffect(() => {
    createClient();
  }, [createClient]);

  const makePaymentRequest = useCallback(async (
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<PaymentResponse> => {
    const requestId = Math.random().toString(36).substr(2, 9);
    console.log(`🚀 [${requestId}] Making X402 payment request to: ${endpoint}`);
    
    console.log(`📊 [${requestId}] Hook state:`, {
      hasClient: !!client,
      clientType: client ? typeof client.get : 'no client',
      isCreatingClient,
      lastWalletAddress,
      timestamp: new Date().toISOString()
    });
    
    const currentClient = client || await createClient();
    
    if (!currentClient) {
      throw new Error('No wallet connected or client creation failed');
    }

    // Determine the HTTP method to use
    const method = (options.method || 'GET').toLowerCase();
    
    console.log(`[${requestId}] Making request with method:`, method);
    console.log(`[${requestId}] === EXTENSIVE CLIENT DEBUGGING ===`);
      console.log('currentClient:', {
        exists: !!currentClient,
        type: typeof currentClient,
        constructor: currentClient?.constructor?.name,
        isNull: currentClient === null,
        isUndefined: currentClient === undefined,
        toString: currentClient?.toString?.(),
      });
      
      console.log('Client methods:', {
        get: typeof currentClient?.get,
        post: typeof currentClient?.post,
        put: typeof currentClient?.put,
        delete: typeof currentClient?.delete,
        patch: typeof currentClient?.patch,
        request: typeof currentClient?.request
      });
      
      console.log('Client properties:', {
        defaults: typeof currentClient?.defaults,
        interceptors: typeof currentClient?.interceptors,
        prototype: Object.getPrototypeOf(currentClient)?.constructor?.name,
        ownKeys: currentClient ? Object.getOwnPropertyNames(currentClient).slice(0, 15) : [],
        allKeys: currentClient ? Object.keys(currentClient).slice(0, 15) : []
      });

      // Check if we can access methods via prototype
      if (currentClient) {
        const proto = Object.getPrototypeOf(currentClient);
        console.log('Prototype methods:', {
          protoGet: typeof proto?.get,
          protoPost: typeof proto?.post,
          protoRequest: typeof proto?.request
        });
      }

    try {
      let response;
      
      // Final validation before making request
      if (typeof currentClient.get !== 'function') {
        console.error(`❌ [${requestId}] CRITICAL: currentClient.get is not a function!`);
        console.error(`[${requestId}] This indicates the x402 interceptor corrupted the axios instance`);
        
        // Create a fresh axios client as emergency fallback
        console.log('🚨 Creating emergency axios client...');
        const emergencyClient = axios.create({
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Emergency client validation:', {
          hasGet: typeof emergencyClient.get,
          hasPost: typeof emergencyClient.post,
          constructor: emergencyClient.constructor?.name
        });
        
        // Update state with working client
        setClient(emergencyClient);
        setClientError('x402 interceptor failed - using fallback (no payments)');
        
        // Use emergency client for this request
        switch (method) {
          case 'get':
            response = await emergencyClient.get(endpoint, { params: options.params, ...options });
            break;
          case 'post':
            response = await emergencyClient.post(endpoint, options.data, { params: options.params, ...options });
            break;
          case 'put':
            response = await emergencyClient.put(endpoint, options.data, { params: options.params, ...options });
            break;
          case 'delete':
            response = await emergencyClient.delete(endpoint, { params: options.params, ...options });
            break;
          case 'patch':
            response = await emergencyClient.patch(endpoint, options.data, { params: options.params, ...options });
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }
        
        console.log('✅ Emergency request successful:', {
          method,
          status: response.status
        });

        return {
          data: response.data,
          paymentResponse: undefined, // No payment functionality with emergency client
          status: response.status,
          headers: response.headers
        };
      }
      
      // Use the appropriate HTTP method directly
      // This approach follows the x402-axios examples where they use .get(), .post(), etc.
      switch (method) {
        case 'get':
          response = await currentClient.get(endpoint, { 
            params: options.params, 
            ...options 
          });
          break;
          
        case 'post':
          response = await currentClient.post(endpoint, options.data, { 
            params: options.params, 
            ...options 
          });
          break;
          
        case 'put':
          response = await currentClient.put(endpoint, options.data, { 
            params: options.params, 
            ...options 
          });
          break;
          
        case 'delete':
          response = await currentClient.delete(endpoint, { 
            params: options.params, 
            ...options 
          });
          break;
          
        case 'patch':
          response = await currentClient.patch(endpoint, options.data, { 
            params: options.params, 
            ...options 
          });
          break;
          
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      console.log('✅ Request successful:', {
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

    } catch (error: any) {
      console.log('Request failed:', {
        status: error.response?.status,
        message: error.message
      });

      // Let x402-axios handle 402 responses automatically
      // For non-402 errors, re-throw them
      throw error;
    }
  }, [client, createClient]);

  return {
    client,
    makePaymentRequest,
    isLoading: isCreatingClient,
    error: clientError,
    isReady: !!client && !isCreatingClient,
    walletAddress: wallets.find(w => w.address === lastWalletAddress)?.address || null,
    isClientReady: !!client && !isCreatingClient,
    createClient
  };
}
