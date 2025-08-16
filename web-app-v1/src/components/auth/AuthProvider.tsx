'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { privyConfig } from '@/lib/auth/privy-config';
import { useState, useEffect } from 'react';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Isolated auth provider that won't interfere with other components
export default function AuthProvider({ children }: AuthProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure client-side only rendering to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render Privy until mounted to prevent SSR issues
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider {...privyConfig}>
      {children}
    </PrivyProvider>
  );
}
