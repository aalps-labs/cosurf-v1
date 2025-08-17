'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoginTriggerContextType {
  triggerLogin: () => void;
  setLoginTrigger: (trigger: () => void) => void;
}

const LoginTriggerContext = createContext<LoginTriggerContextType | undefined>(undefined);

export function useLoginTrigger() {
  const context = useContext(LoginTriggerContext);
  if (context === undefined) {
    throw new Error('useLoginTrigger must be used within a LoginTriggerProvider');
  }
  return context;
}

interface LoginTriggerProviderProps {
  children: ReactNode;
}

export default function LoginTriggerProvider({ children }: LoginTriggerProviderProps) {
  const [loginTriggerFn, setLoginTriggerFn] = useState<(() => void) | null>(null);

  const triggerLogin = useCallback(() => {
    if (loginTriggerFn) {
      loginTriggerFn();
    }
  }, [loginTriggerFn]);

  const setLoginTrigger = useCallback((trigger: () => void) => {
    setLoginTriggerFn(() => trigger);
  }, []);

  return (
    <LoginTriggerContext.Provider value={{ triggerLogin, setLoginTrigger }}>
      {children}
    </LoginTriggerContext.Provider>
  );
}
