// src/lib/privy-wallet.ts
'use client';

import { createWalletClient, custom, publicActions, WalletClient } from "viem";
import { baseSepolia, base, Chain } from "viem/chains";
import { useWallets } from "@privy-io/react-auth";
import { useCallback, useMemo } from "react";

export function useViemWalletClient() {
  const { wallets } = useWallets();
  
  // Get the first connected wallet (primary wallet)
  const wallet = useMemo(() => wallets?.[0], [wallets]);

  // Determine the correct chain based on environment
  const getChain = useCallback((): Chain => {
    const network = process.env.NEXT_PUBLIC_NETWORK || 'base-sepolia';
    return network === 'base' ? base : baseSepolia;
  }, []);

  const getClient = useCallback(async (): Promise<WalletClient> => {
    if (!wallet) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }
    
    const chain = getChain();
    
    try {
      // Ensure wallet is on the correct chain
      await wallet.switchChain(chain.id);
      
      // Get EIP-1193 provider from Privy wallet
      const provider = await wallet.getEthereumProvider();
      
      if (!provider) {
        throw new Error("Failed to get Ethereum provider from wallet");
      }
      
      // Create viem wallet client with Privy provider
      const walletClient = createWalletClient({
        account: wallet.address as `0x${string}`,
        chain,
        transport: custom(provider),
      }).extend(publicActions);

      return walletClient;
    } catch (error) {
      console.error('Failed to create wallet client:', error);
      throw new Error(`Failed to initialize wallet client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [wallet, getChain]);

  const isReady = useCallback(() => {
    return !!(wallets && wallets.length > 0 && wallet);
  }, [wallets, wallet]);

  const getAddress = useCallback(() => {
    return wallet?.address as `0x${string}` | undefined;
  }, [wallet]);

  const getChainId = useCallback(() => {
    return getChain().id;
  }, [getChain]);

  const switchChain = useCallback(async (chainId: number) => {
    if (!wallet) {
      throw new Error("No wallet connected");
    }
    
    try {
      await wallet.switchChain(chainId);
      return true;
    } catch (error) {
      console.error('Failed to switch chain:', error);
      throw error;
    }
  }, [wallet]);

  return { 
    getClient, 
    isReady, 
    getAddress,
    getChainId,
    switchChain,
    wallet,
    wallets: wallets || []
  };
}
