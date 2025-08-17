'use client';

import { useState, useEffect } from 'react';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Legacy auth provider - now just handles mounting state
// PrivyProvider is now handled at the root level in ClientProviders
export default function AuthProvider({ children }: AuthProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure client-side only rendering to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent SSR issues
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
