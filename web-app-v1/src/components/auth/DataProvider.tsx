'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Channel {
  id: string;
  name: string;
  channel_handle: string;
  description?: string;
  created_at: string;
  is_active: boolean;
  followers_count?: number;
  rep_score?: number;
  user_id: string;
}

interface DataContextType {
  userChannels: Channel[];
  isDataReady: boolean;
  refreshUserChannels: () => void;
  hasChannelData: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useUserData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: ReactNode;
}

export default function DataProvider({ children }: DataProviderProps) {
  const [userChannels, setUserChannels] = useState<Channel[]>([]);
  const [isDataReady, setIsDataReady] = useState(false);

  // Load user channels from localStorage synchronously
  const loadUserChannels = () => {
    try {
      const connectedChannels = localStorage.getItem('connected_channels');
      if (connectedChannels) {
        const channels: Channel[] = JSON.parse(connectedChannels);
        setUserChannels(channels);
        console.log('📊 Global: Loaded user channels from localStorage:', channels.length);
        return channels;
      }
    } catch (error) {
      console.warn('Global: Failed to load user channels from localStorage:', error);
    }
    return [];
  };

  // Refresh function for external updates
  const refreshUserChannels = () => {
    loadUserChannels();
  };

  // Load data immediately on mount
  useEffect(() => {
    loadUserChannels();
    setIsDataReady(true); // Mark as ready after localStorage load
  }, []);

  // Listen for localStorage changes (from other tabs or components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'connected_channels') {
        console.log('📊 Global: localStorage changed, reloading user channels');
        loadUserChannels();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Show loading screen until data is ready
  if (!isDataReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your data...</p>
        </div>
      </div>
    );
  }

  const hasChannelData = userChannels.length > 0;

  return (
    <DataContext.Provider value={{ userChannels, isDataReady, refreshUserChannels, hasChannelData }}>
      {children}
    </DataContext.Provider>
  );
}
