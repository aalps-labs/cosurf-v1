// src/lib/x402-client.ts
'use client';

import axios from 'axios';
import { withPaymentInterceptor, decodeXPaymentResponse } from 'x402-axios';
import { createWalletAccount } from './wallet';

export class X402PaymentClient {
  private client: any;
  private account: any;

  constructor() {
    try {
      const { account } = createWalletAccount();
      this.account = account;
      
      // Create axios instance with payment interceptor
      this.client = withPaymentInterceptor(
        axios.create({
          baseURL: '', // Will use relative URLs
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          }
        }),
        account as any
      );

      // Add response interceptor to handle payment responses
      this.client.interceptors.response.use(
        (response: any) => {
          // Decode payment response if present
          const paymentResponseHeader = response.headers['x-payment-response'];
          if (paymentResponseHeader) {
            const paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
            response.paymentResponse = paymentResponse;
          }
          return response;
        },
        (error: any) => {
          console.error('Payment request failed:', error);
          throw error;
        }
      );

    } catch (error) {
      console.error('Failed to initialize X402 client:', error);
      throw error;
    }
  }

  async makePaymentRequest(endpoint: string, options: any = {}) {
    try {
      const response = await this.client.request({
        url: endpoint,
        method: options.method || 'GET',
        data: options.data,
        params: options.params,
        ...options
      });

      return {
        data: response.data,
        paymentResponse: response.paymentResponse,
        status: response.status,
        headers: response.headers
      };
    } catch (error: any) {
      if (error.response?.status === 402) {
        // Payment required - this should be handled automatically by x402-axios
        console.log('Payment required:', error.response.data);
      }
      throw error;
    }
  }

  getAccount() {
    return this.account;
  }
}
