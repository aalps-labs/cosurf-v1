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
        id: 1, // Ethereum Mainnet
        name: 'Ethereum',
        network: 'homestead',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
          default: { http: ['https://eth.llamarpc.com'] },
          public: { http: ['https://eth.llamarpc.com'] }
        },
        blockExplorers: {
          default: { name: 'Etherscan', url: 'https://etherscan.io' }
        }
      }
    ],
    // Ensure proper session handling
    session: {
      sameSite: 'lax' as const
    }
  }
};
