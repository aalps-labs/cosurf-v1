'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Folder, Document } from '../components/FolderTree';

interface ChannelData {
  folders: Folder[];
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
}

interface UseChannelDataReturn extends ChannelData {
  refetch: () => Promise<void>;
  sync: () => Promise<void>;
}

/**
 * Custom hook for loading and managing channel data
 * Integrates with the publishing service to fetch folders and documents
 */
export const useChannelData = (channelId: string): UseChannelDataReturn => {
  const [data, setData] = useState<ChannelData>({
    folders: [],
    documents: [],
    isLoading: true,
    error: null,
    lastSyncTime: null
  });

  // Load data from localStorage cache first
  const loadFromCache = useCallback(() => {
    try {
      const cacheKey = `channel_data_${channelId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedData = JSON.parse(cached);
        // Only use cache if it's less than 5 minutes old
        const cacheAge = Date.now() - new Date(parsedData.timestamp).getTime();
        if (cacheAge < 5 * 60 * 1000) {
          console.log(`📦 Loading channel ${channelId} from cache`);
          setData(prev => ({
            ...prev,
            folders: parsedData.folders || [],
            documents: parsedData.documents || [],
            lastSyncTime: new Date(parsedData.timestamp),
            isLoading: false
          }));
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to load from cache:', error);
    }
    return false;
  }, [channelId]);

  // Save data to localStorage cache
  const saveToCache = useCallback((folders: Folder[], documents: Document[]) => {
    try {
      const cacheKey = `channel_data_${channelId}`;
      const cacheData = {
        folders,
        documents,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 Cached channel ${channelId} data`);
    } catch (error) {
      console.warn('Failed to save to cache:', error);
    }
  }, [channelId]);

  // Fetch data from backend using sync API
  const fetchChannelData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      console.log(`🔄 Fetching real channel data for: ${channelId}`);
      
      // Use the sync API endpoints from channel_sync.md
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // 1. Get folder configuration to check if channel has data
      const configResponse = await fetch(`${baseUrl}/api/v1/sync/channels/${channelId}/config`);
      
      if (!configResponse.ok) {
        if (configResponse.status === 404) {
          throw new Error('Channel not found');
        }
        throw new Error(`Failed to fetch channel config: ${configResponse.status}`);
      }
      
      const configData = await configResponse.json();
      
      // 2. Pull folder structure
      const foldersResponse = await fetch(`${baseUrl}/api/v1/sync/channels/${channelId}/folders`);
      
      if (!foldersResponse.ok) {
        throw new Error(`Failed to fetch folders: ${foldersResponse.status}`);
      }
      
      const foldersData = await foldersResponse.json();
      
      // 3. Pull documents if any exist
      let documentsData = { documents: [] };
      if (configData.documents && configData.documents.length > 0) {
        const documentIds = configData.documents.map((doc: any) => doc.id);
        
        const documentsResponse = await fetch(`${baseUrl}/api/v1/sync/channels/${channelId}/documents/pull`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documentIds: documentIds
          })
        });
        
        if (documentsResponse.ok) {
          documentsData = await documentsResponse.json();
        } else {
          console.warn(`Failed to fetch documents: ${documentsResponse.status}`);
        }
      }
      
      // 4. Transform backend data to frontend format
      const transformedData = transformBackendData(foldersData, documentsData);

      // Save to cache
      saveToCache(transformedData.folders, transformedData.documents);

      setData(prev => ({
        ...prev,
        folders: transformedData.folders,
        documents: transformedData.documents,
        isLoading: false,
        error: null,
        lastSyncTime: new Date()
      }));

      console.log(`✅ Successfully loaded channel ${channelId} data:`, {
        folders: transformedData.folders.length,
        documents: transformedData.documents.length
      });

    } catch (error) {
      console.error('Failed to fetch channel data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load channel data'
      }));
    }
  }, [channelId, saveToCache]);

  // Transform backend API data to frontend format
  const transformBackendData = useCallback((foldersData: any, documentsData: any) => {
    // Transform documents from backend format to frontend format
    const documents: Document[] = (documentsData.documents || []).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      canonicalUrl: doc.canonicalUrl,
      faviconUrl: doc.faviconUrl || '',
      iconUrl: doc.iconUrl || '',
      processStatus: doc.processStatus,
      hasContent: doc.hasContent,
      isRagProcessed: doc.isRagProcessed,
      docType: doc.docType
    }));

    // Build nested folder structure from flat backend format
    const buildNestedFolders = (backendFolders: any[], backendFolderItems: any[]): Folder[] => {
      if (!backendFolders || backendFolders.length === 0) return [];

      // Create folder lookup map
      const folderMap = new Map<string, Folder>();
      
      // First, create all folders
      backendFolders.forEach(backendFolder => {
        const folder: Folder = {
          id: backendFolder.id,
          name: backendFolder.name,
          items: [],
          subfolders: [],
          readme: backendFolder.readme,
          isPublic: backendFolder.isPublic,
          currentHash: backendFolder.lastPushedHash,
          lastPushedHash: backendFolder.lastPushedHash,
          createdAt: backendFolder.createdAt,
          updatedAt: backendFolder.updatedAt
        };
        folderMap.set(backendFolder.id, folder);
      });

      // Add items to folders
      (backendFolderItems || []).forEach((item: any) => {
        const folder = folderMap.get(item.folderId);
        if (folder) {
          folder.items.push({
            id: item.id,
            surfId: item.contentId,
            notes: item.notes,
            createdAt: item.createdAt
          });
        }
      });

      // Build parent-child relationships
      const rootFolders: Folder[] = [];
      
      backendFolders
        .sort((a, b) => a.depth - b.depth)
        .forEach(backendFolder => {
          const folder = folderMap.get(backendFolder.id);
          if (!folder) return;

          if (!backendFolder.parentId) {
            rootFolders.push(folder);
          } else {
            const parent = folderMap.get(backendFolder.parentId);
            if (parent) {
              parent.subfolders.push(folder);
            } else {
              rootFolders.push(folder);
            }
          }
        });

      return rootFolders;
    };

    const folders = buildNestedFolders(foldersData.folders || [], foldersData.folderItems || []);

    return { folders, documents };
  }, []);

  // Sync data (pull + push if needed)
  const sync = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      console.log(`🔄 Syncing channel: ${channelId}`);
      
      // For now, sync just means refetch the latest data
      // In the future, this could include push operations
      await fetchChannelData();

    } catch (error) {
      console.error('Failed to sync channel:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to sync channel'
      }));
    }
  }, [channelId, fetchChannelData]);

  // Initial load
  useEffect(() => {
    if (!channelId) return;

    // Try cache first, then fetch if cache miss
    const cacheHit = loadFromCache();
    if (!cacheHit) {
      fetchChannelData();
    }
  }, [channelId, loadFromCache, fetchChannelData]);

  return {
    ...data,
    refetch: fetchChannelData,
    sync
  };
};
