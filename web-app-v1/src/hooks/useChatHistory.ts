'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  channelId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UseChatHistoryReturn {
  currentSession: ChatSession | null;
  recentSessions: ChatSession[];
  createNewSession: (channelId: string, channelName?: string) => string;
  loadSession: (sessionId: string) => void;
  updateSession: (sessionId: string, messages: Message[]) => void;
  deleteSession: (sessionId: string) => void;
  clearAllSessions: () => void;
}

const MAX_SESSIONS = 10;

export const useChatHistory = (channelId: string): UseChatHistoryReturn => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<ChatSession[]>([]);

  // Load sessions from localStorage on mount
  useEffect(() => {
    loadSessionsFromStorage();
  }, [channelId]);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (recentSessions.length > 0) {
      saveSessionsToStorage();
    }
  }, [recentSessions]);

  const loadSessionsFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(`chat_sessions_${channelId}`);
      if (stored) {
        const sessions: ChatSession[] = JSON.parse(stored).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        
        // Sort by most recent first
        sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        
        setRecentSessions(sessions);
        
        // Load the most recent session if available
        if (sessions.length > 0) {
          setCurrentSession(sessions[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  }, [channelId]);

  const saveSessionsToStorage = useCallback(() => {
    try {
      localStorage.setItem(`chat_sessions_${channelId}`, JSON.stringify(recentSessions));
    } catch (error) {
      console.error('Failed to save chat sessions:', error);
    }
  }, [channelId, recentSessions]);

  const generateSessionTitle = (messages: Message[]): string => {
    // Find the first user message
    const firstUserMessage = messages.find(msg => msg.sender === 'user');
    if (firstUserMessage) {
      // Use first 40 characters of the first user message
      return firstUserMessage.content.length > 40 
        ? firstUserMessage.content.substring(0, 40) + '...'
        : firstUserMessage.content;
    }
    return 'New Chat';
  };

  const createNewSession = useCallback((channelId: string, channelName?: string): string => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const welcomeMessage: Message = {
      id: 'welcome-1',
      content: `I recently found some interesting updates about ${channelName || 'this channel'}. What would you like to explore or discuss?`,
      sender: 'assistant',
      timestamp: now
    };

    const newSession: ChatSession = {
      id: sessionId,
      title: 'New Chat',
      messages: [welcomeMessage],
      channelId,
      createdAt: now,
      updatedAt: now
    };

    setCurrentSession(newSession);
    
    // Add to recent sessions and maintain max limit
    setRecentSessions(prev => {
      const updated = [newSession, ...prev];
      return updated.slice(0, MAX_SESSIONS); // Keep only the most recent 10
    });

    return sessionId;
  }, []);

  const loadSession = useCallback((sessionId: string) => {
    const session = recentSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
    }
  }, [recentSessions]);

  const updateSession = useCallback((sessionId: string, messages: Message[]) => {
    const now = new Date();
    
    setRecentSessions(prev => {
      const updated = prev.map(session => {
        if (session.id === sessionId) {
          const updatedSession = {
            ...session,
            messages,
            title: generateSessionTitle(messages),
            updatedAt: now
          };
          
          // Update current session if it's the one being updated
          if (currentSession?.id === sessionId) {
            setCurrentSession(updatedSession);
          }
          
          return updatedSession;
        }
        return session;
      });
      
      // Sort by most recent first
      return updated.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    });
  }, [currentSession]);

  const deleteSession = useCallback((sessionId: string) => {
    setRecentSessions(prev => prev.filter(session => session.id !== sessionId));
    
    // If we're deleting the current session, clear it
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
  }, [currentSession]);

  const clearAllSessions = useCallback(() => {
    setRecentSessions([]);
    setCurrentSession(null);
    localStorage.removeItem(`chat_sessions_${channelId}`);
  }, [channelId]);

  return {
    currentSession,
    recentSessions,
    createNewSession,
    loadSession,
    updateSession,
    deleteSession,
    clearAllSessions
  };
};
