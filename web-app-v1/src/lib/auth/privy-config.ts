// Privy configuration - isolated module
export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'clp2ua4560006l80fpxvvgzbn', // Replace with your actual app ID
  config: {
    loginMethods: ['email', 'wallet', 'google', 'twitter'] as ('email' | 'wallet' | 'google' | 'twitter')[],
    appearance: {
      theme: 'light' as const,
      accentColor: '#3B82F6' as `#${string}`,
      logo: undefined // Add your logo URL here if needed
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets' as const
    },
    // Handle OAuth redirects properly
    supportedChains: [
      {
        id: 84532, // Base Sepolia
        name: 'Base Sepolia',
        network: 'base-sepolia',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
          default: { http: ['https://sepolia.base.org'] },
          public: { http: ['https://sepolia.base.org'] }
        },
        blockExplorers: {
          default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' }
        }
      },
      {
        id: 8453, // Base Mainnet
        name: 'Base',
        network: 'base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
          default: { http: ['https://mainnet.base.org'] },
          public: { http: ['https://mainnet.base.org'] }
        },
        blockExplorers: {
          default: { name: 'BaseScan', url: 'https://basescan.org' }
        }
      }
    ],
    // Ensure proper session handling
    session: {
      sameSite: 'lax' as const
    }
  }
};
