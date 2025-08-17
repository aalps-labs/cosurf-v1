// src/components/ClientProviders.tsx
'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { privyConfig } from '@/lib/auth/privy-config';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <PrivyProvider 
      appId={privyConfig.appId} 
      config={privyConfig.config}
    >
      {children}
    </PrivyProvider>
  );
}
