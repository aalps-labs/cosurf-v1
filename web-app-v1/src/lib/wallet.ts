// src/lib/wallet.ts
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, base } from "viem/chains";

export function createWalletAccount() {
  const privateKey = process.env.NEXT_PUBLIC_BUYER_PRIVATE_KEY as `0x${string}`;
  const network = process.env.NEXT_PUBLIC_NETWORK || 'base-sepolia';
  
  if (!privateKey) {
    throw new Error("Private key not found in environment variables");
  }

  const account = privateKeyToAccount(privateKey);
  
  const chain = network === 'base' ? base : baseSepolia;
  
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http()
  });

  return { account, walletClient, chain };
}
