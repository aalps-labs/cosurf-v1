// src/lib/x402-client.ts
'use client';

import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { withPaymentInterceptor, decodeXPaymentResponse } from 'x402-axios';
import { useViemWalletClient } from './privy-wallet';
import { useCallback, useEffect, useState } from 'react';
import { WalletClient } from 'viem';

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

export function useX402Client() {
  const { getClient, isReady, getAddress, wallet } = useViemWalletClient();
  const [client, setClient] = useState<AxiosInstance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastWalletAddress, setLastWalletAddress] = useState<string | undefined>(undefined);

  const createClient = useCallback(async (): Promise<AxiosInstance> => {
    if (!isReady()) {
      throw new Error('No wallet connected. Please connect your wallet first.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const walletClient: WalletClient = await getClient();
      
      // Verify wallet client has the required properties for x402-axios
      if (!walletClient.account) {
        throw new Error('Wallet client does not have an account');
      }

      console.log('Creating X402 client with Privy wallet:', walletClient.account.address);
      
      // Create axios instance with payment interceptor
      // x402-axios expects a wallet client that implements signing methods
      const axiosClient = withPaymentInterceptor(
        axios.create({
          baseURL: '', // Will use relative URLs
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          }
        }),
        walletClient as never  // Type compatibility - viem WalletClient should work with x402-axios
      );

      // Add response interceptor to handle payment responses
      axiosClient.interceptors.response.use(
        (response: AxiosResponse) => {
          // Decode payment response if present
          const paymentResponseHeader = response.headers['x-payment-response'];
          if (paymentResponseHeader) {
            try {
              const paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
              (response as AxiosResponse & { paymentResponse?: unknown }).paymentResponse = paymentResponse;
              console.log('Payment response decoded:', paymentResponse);
            } catch (decodeError) {
              console.warn('Failed to decode payment response:', decodeError);
            }
          }
          return response;
        },
        (error: Error) => {
          // Handle payment errors gracefully
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { status?: number; data?: unknown } };
            if (axiosError.response?.status === 402) {
              console.log('Payment required - x402 will handle automatically');
            } else {
              console.error('Payment request failed:', error);
            }
          } else {
            console.error('Payment request failed:', error);
          }
          throw error;
        }
      );

      setClient(axiosClient);
      setLastWalletAddress(walletClient.account.address);
      return axiosClient;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize x402 client';
      setError(errorMessage);
      console.error('Failed to initialize X402 client:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getClient, isReady]);

  const makePaymentRequest = useCallback(async (endpoint: string, options: RequestOptions = {}): Promise<PaymentResponse> => {
    if (!client) {
      throw new Error('Client not initialized. Call createClient() first.');
    }

    try {
      console.log(`Making X402 payment request to: ${endpoint}`);
      
      const response = await client.request({
        url: endpoint,
        method: options.method || 'GET',
        data: options.data,
        params: options.params,
        ...options
      });

      console.log(`X402 request successful: ${endpoint}`, {
        status: response.status,
        hasPaymentResponse: !!(response as AxiosResponse & { paymentResponse?: unknown }).paymentResponse
      });

      return {
        data: response.data,
        paymentResponse: (response as AxiosResponse & { paymentResponse?: unknown }).paymentResponse,
        status: response.status,
        headers: response.headers
      };
    } catch (error: unknown) {
      console.error(`X402 request failed for ${endpoint}:`, error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        if (axiosError.response?.status === 402) {
          // Payment required - this should be handled automatically by x402-axios
          console.log('Payment required (402) - x402-axios should handle this automatically');
        }
      }
      throw error;
    }
  }, [client]);

  // Auto-initialize client when wallet becomes ready or changes
  useEffect(() => {
    const currentAddress = getAddress();
    
    // Initialize client if:
    // 1. Wallet is ready and no client exists
    // 2. Wallet address has changed (user switched wallets)
    if (isReady() && (!client || currentAddress !== lastWalletAddress) && !isLoading) {
      console.log('Auto-initializing X402 client for wallet:', currentAddress);
      createClient().catch((error) => {
        console.error('Auto-initialization failed:', error);
      });
    }
  }, [isReady, client, isLoading, createClient, getAddress, lastWalletAddress]);

  // Reset client if wallet disconnects
  useEffect(() => {
    if (!isReady() && client) {
      console.log('Wallet disconnected, resetting X402 client');
      setClient(null);
      setLastWalletAddress(undefined);
      setError(null);
    }
  }, [isReady, client]);

  return {
    client,
    createClient,
    makePaymentRequest,
    isLoading,
    error,
    isReady: isReady(),
    walletAddress: getAddress(),
    wallet
  };
}

// Legacy class-based client for backward compatibility (deprecated)
// This class is deprecated and should not be used. Use useX402Client() hook instead.
export class X402PaymentClient {
  constructor() {
    throw new Error(
      'X402PaymentClient class is deprecated and has been removed for security reasons. ' +
      'Please use useX402Client() hook with Privy wallet integration instead. ' +
      'See the updated PaymentInterface component for proper usage.'
    );
  }

  async makePaymentRequest(_endpoint: string, _options?: RequestOptions): Promise<never> {
    throw new Error('X402PaymentClient class is deprecated. Please use useX402Client() hook with Privy wallet.');
  }

  getAccount(): never {
    throw new Error('X402PaymentClient class is deprecated. Please use useX402Client() hook with Privy wallet.');
  }
}
